import axios from 'axios'
import type { Document, HistoryTurn, SourceChunk } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE })

// Attach bearer token when available
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('documind_auth')
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string }
      if (parsed.token) config.headers.Authorization = `Bearer ${parsed.token}`
    }
  } catch {}
  return config
})

function getToken(): string | undefined {
  try {
    const raw = localStorage.getItem('documind_auth')
    if (raw) return (JSON.parse(raw) as { token?: string }).token
  } catch {}
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string
  token_type: string
  username: string
}

export const loginRequest = async (username: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', { username, password })
  return data
}

// ── Documents ──────────────────────────────────────────────────────────────

export const getDocuments = async (): Promise<Document[]> => {
  const { data } = await api.get<{ documents: Document[] }>('/documents')
  return data.documents
}

export const uploadDocument = async (
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Document> => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<Document>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  return data
}

export const deleteDocument = async (docId: string): Promise<void> => {
  await api.delete(`/documents/${docId}`)
}

export const getDocumentFileUrl = (docId: string): string =>
  `${BASE}/documents/${docId}/file`

export const downloadDocument = (docId: string, filename: string): void => {
  const a = document.createElement('a')
  a.href = `${BASE}/documents/${docId}/file?download=true`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Chat (SSE streaming) ───────────────────────────────────────────────────

type SSEEvent =
  | { type: 'token'; token: string }
  | { type: 'sources'; sources: SourceChunk[] }
  | { type: 'done' }

export const streamMessage = async (
  docId: string,
  message: string,
  history: HistoryTurn[],
  onToken: (token: string) => void,
  onSources: (sources: SourceChunk[]) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> => {
  const token = getToken()

  let response: Response
  try {
    response = await fetch(`${BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ doc_id: docId, message, history }),
    })
  } catch {
    onError('Network error. Please check your connection.')
    return
  }

  if (!response.ok) {
    onError('Something went wrong. Please try again.')
    return
  }

  if (!response.body) {
    onError('No response stream received.')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6)) as SSEEvent
          if (event.type === 'token') onToken(event.token)
          else if (event.type === 'sources') onSources(event.sources)
          else if (event.type === 'done') onDone()
        } catch {}
      }
    }
  } catch {
    onError('Stream interrupted. Please try again.')
  }
}
