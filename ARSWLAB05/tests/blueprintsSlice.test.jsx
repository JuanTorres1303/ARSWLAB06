import { describe, it, expect } from 'vitest'
import reducer, { blueprintUpdated } from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
  })

  it('blueprintUpdated (STOMP) actualiza el plano abierto y la tabla del autor', () => {
    const house = { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] }
    const garage = { author: 'john', name: 'garage', points: [] }
    const initial = {
      ...reducer(undefined, { type: '@@INIT' }),
      current: house,
      byAuthor: { john: [house, garage] },
    }
    const updated = { ...house, points: [{ x: 1, y: 1 }, { x: 50, y: 60 }] }

    const state = reducer(initial, blueprintUpdated(updated))

    expect(state.current.points).toHaveLength(2)
    expect(state.byAuthor.john[0].points).toHaveLength(2)
    expect(state.byAuthor.john[1]).toEqual(garage)
  })

  it('blueprintUpdated de otro plano no cambia el plano abierto', () => {
    const house = { author: 'john', name: 'house', points: [] }
    const initial = { ...reducer(undefined, { type: '@@INIT' }), current: house }

    const state = reducer(initial, blueprintUpdated({ author: 'jane', name: 'garden', points: [{ x: 5, y: 5 }] }))

    expect(state.current).toEqual(house)
  })
})
