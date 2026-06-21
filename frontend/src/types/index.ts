export interface Document {
  doc_id: string
  filename: string
  file_type: string
  file_size_bytes: number
  chunk_count: number
  created_at: string
}

export interface HistoryTurn {
  user: string
  assistant: string
}

export interface SourceChunk {
  content: string
  chunk_index: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceChunk[]
  timestamp: Date
}
