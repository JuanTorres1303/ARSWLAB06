import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
  const { data } = await api.get('/blueprints')
  const authors = [...new Set(data.map((bp) => bp.author))]
  return authors
})

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
  const { data } = await api.get(`/blueprints/${encodeURIComponent(author)}`)
  return { author, items: data }
})

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  async ({ author, name }) => {
    const { data } = await api.get(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
    )
    return data
  },
)

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
  const { data } = await api.post('/blueprints', payload)
  return data
})

export const updateBlueprint = createAsyncThunk(
  'blueprints/updateBlueprint',
  async ({ author, name, points }) => {
    const { data } = await api.put(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
      { author, name, points },
    )
    return data
  },
)

export const deleteBlueprint = createAsyncThunk(
  'blueprints/deleteBlueprint',
  async ({ author, name }) => {
    await api.delete(`/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`)
    return { author, name }
  },
)

// Reemplaza un plano en el canvas (current) y en la tabla del autor (byAuthor)
function upsert(s, bp) {
  if (s.current && s.current.author === bp.author && s.current.name === bp.name) s.current = bp
  const list = s.byAuthor[bp.author]
  if (list) {
    const i = list.findIndex((x) => x.name === bp.name)
    if (i >= 0) list[i] = bp
  }
}

const slice = createSlice({
  name: 'blueprints',
  initialState: {
    authors: [],
    byAuthor: {},
    current: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    // Llega por STOMP cada vez que alguien dibuja en el plano abierto
    blueprintUpdated: (s, a) => upsert(s, a.payload),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthors.pending, (s) => {
        s.status = 'loading'
      })
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.authors = a.payload
      })
      .addCase(fetchAuthors.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })
      .addCase(fetchByAuthor.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.current = a.payload
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.error = a.error.message
      })
      .addCase(createBlueprint.fulfilled, (s, a) => {
        const bp = a.payload
        s.byAuthor[bp.author] = [...(s.byAuthor[bp.author] || []), bp]
      })
      .addCase(createBlueprint.rejected, (s, a) => {
        s.error = a.error.message
      })
      .addCase(updateBlueprint.fulfilled, (s, a) => {
        s.error = null
        upsert(s, a.payload)
      })
      .addCase(updateBlueprint.rejected, (s, a) => {
        s.error = a.error.message
      })
      .addCase(deleteBlueprint.fulfilled, (s, a) => {
        const { author, name } = a.payload
        s.error = null
        s.byAuthor[author] = (s.byAuthor[author] || []).filter((bp) => bp.name !== name)
        if (s.current?.author === author && s.current?.name === name) s.current = null
      })
      .addCase(deleteBlueprint.rejected, (s, a) => {
        s.error = a.error.message
      })
  },
})

export const { blueprintUpdated } = slice.actions

export default slice.reducer
