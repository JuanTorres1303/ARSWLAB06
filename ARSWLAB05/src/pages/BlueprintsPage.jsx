import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  blueprintUpdated,
} from '../features/blueprints/blueprintsSlice.js'
import { connectBlueprint } from '../services/stompClient.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import BlueprintForm from '../components/BlueprintForm.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { byAuthor, current, status, error } = useSelector((s) => s.blueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [rtConnected, setRtConnected] = useState(false)
  const rtRef = useRef(null)
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    if (localStorage.getItem('token')) dispatch(fetchAuthors())
  }, [dispatch])

  // Tiempo real: al abrir un plano se suscribe a /topic/blueprints.{author}.{name}.
  // Depende solo de author/name para no reconectar con cada punto recibido.
  const rtAuthor = current?.author
  const rtName = current?.name
  useEffect(() => {
    if (!rtAuthor || !rtName) return
    const rt = connectBlueprint(
      rtAuthor,
      rtName,
      (bp) => dispatch(blueprintUpdated(bp)),
      setRtConnected,
    )
    rtRef.current = rt
    return () => {
      rt.disconnect()
      rtRef.current = null
      setRtConnected(false)
    }
  }, [rtAuthor, rtName, dispatch])

  // El punto va al servidor, que lo guarda y lo reenvía a todas las pestañas (incluida esta)
  const addPoint = (point) => rtRef.current?.sendPoint(point)
  const save = () => current && dispatch(updateBlueprint(current))
  const remove = () => {
    if (current && window.confirm(`¿Eliminar el plano "${current.name}"?`)) {
      dispatch(deleteBlueprint(current))
    }
  }

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = () => {
    if (!authorInput) return
    setSelectedAuthor(authorInput)
    dispatch(fetchByAuthor(authorInput))
  }

  const openBlueprint = (bp) => {
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      <section className="grid" style={{ gap: 16 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              placeholder="Author: buenos dias "
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <button className="btn primary" onClick={getBlueprints}>
              Get blueprints
            </button>
          </div>
        </div>
        <BlueprintForm onSubmit={(bp) => dispatch(createBlueprint(bp))} />

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>
          {status === 'loading' && <p>Cargando...</p>}
          {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}
          {!items.length && status !== 'loading' && <p>Sin resultados.</p>}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      borderBottom: '1px solid #334155',
                    }}
                  >
                    Blueprint name
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px',
                      borderBottom: '1px solid #334155',
                    }}
                  >
                    Number of points
                  </th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #334155' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((bp) => (
                  <tr key={bp.name}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                      {bp.name}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'right',
                        borderBottom: '1px solid #1f2937',
                      }}
                    >
                      {bp.points?.length || 0}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                      <button className="btn" onClick={() => openBlueprint(bp)}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Current blueprint: {current?.name || '—'}</h3>
        {current && (
          <p style={{ marginTop: 0, color: rtConnected ? '#4ade80' : '#fbbf24' }}>
            {rtConnected
              ? '● Tiempo real conectado (STOMP) — haz clic en el canvas para dibujar'
              : '○ Conectando tiempo real...'}
          </p>
        )}
        <BlueprintCanvas
          id="canvas-blueprint"
          points={current?.points || []}
          width={520}
          height={360}
          onPointAdd={current ? addPoint : undefined}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="btn primary" onClick={save} disabled={!current}>
            Save / Update
          </button>
          <button className="btn" onClick={remove} disabled={!current}>
            Delete
          </button>
        </div>
      </section>
    </div>
  )
}
