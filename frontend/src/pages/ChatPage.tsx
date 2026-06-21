import {
  BookOpen,
  ChevronRight,
  FileText,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getDocuments, streamMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { ChatMessage, Document, HistoryTurn, SourceChunk } from '../types'

const SUGGESTIONS = [
  'Give me a quick summary',
  'What are the main topics?',
  'What are the key facts?',
  'Any important dates or numbers?',
]

function fmt(bytes: number) {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

export default function ChatPage() {
  const { docId } = useParams<{ docId: string }>()
  const { isGuest, guestRequestsLeft, consumeGuestRequest } = useAuth()
  const navigate = useNavigate()

  const [docs, setDocs] = useState<Document[]>([])
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<SourceChunk[]>([])
  const [showSources, setShowSources] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    getDocuments().then((d) => {
      setDocs(d)
      if (docId) {
        const found = d.find((x) => x.doc_id === docId)
        if (found) setActiveDoc(found)
      }
    }).catch(() => {})
  }, [docId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const history = (): HistoryTurn[] =>
    messages.reduce<HistoryTurn[]>((acc, msg, i, arr) => {
      if (msg.role === 'user' && arr[i + 1]?.role === 'assistant') {
        acc.push({ user: msg.content, assistant: arr[i + 1].content })
      }
      return acc
    }, [])

  const guestLimitReached = isGuest && guestRequestsLeft <= 0

  const handleSend = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || !activeDoc || loading) return
    if (guestLimitReached) return

    if (isGuest) {
      const allowed = consumeGuestRequest()
      if (!allowed) return
    }

    const currentHistory = history()
    setInput('')

    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    setMessages((m) => [
      ...m,
      { id: userMsgId, role: 'user', content: q, timestamp: new Date() },
      { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() },
    ])
    setLoading(true)
    setStreamingId(assistantMsgId)

    await streamMessage(
      activeDoc.doc_id,
      q,
      currentHistory,
      (token) => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: msg.content + token } : msg,
          ),
        )
      },
      (srcs) => {
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantMsgId ? { ...msg, sources: srcs } : msg)),
        )
        if (srcs.length) { setSources(srcs); setShowSources(true) }
      },
      () => {
        setLoading(false)
        setStreamingId(null)
        setTimeout(() => inputRef.current?.focus(), 50)
      },
      (errMsg) => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: errMsg } : msg,
          ),
        )
        setLoading(false)
        setStreamingId(null)
      },
    )
  }

  const inputDisabled = !activeDoc || loading || guestLimitReached

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Doc sidebar */}
      <div className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents</span>
          {!isGuest && <Link to="/upload" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Upload</Link>}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {docs.map((doc) => (
            <button
              key={doc.doc_id}
              onClick={() => { setActiveDoc(doc); setMessages([]) }}
              className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                activeDoc?.doc_id === doc.doc_id
                  ? 'bg-indigo-50 border-l-2 border-indigo-600 pl-[10px]'
                  : 'hover:bg-gray-50'
              }`}
            >
              <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${activeDoc?.doc_id === doc.doc_id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${activeDoc?.doc_id === doc.doc_id ? 'text-indigo-700' : 'text-gray-700'}`}>{doc.filename}</p>
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>{fmtDate(doc.created_at)}</span>
                  <span>{fmt(doc.file_size_bytes)}</span>
                </div>
              </div>
            </button>
          ))}
          {docs.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-4 text-center">No documents.<br />
              {!isGuest && <Link to="/upload" className="text-indigo-500 hover:underline">Upload one</Link>}
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-sm font-medium text-gray-800 truncate">
              {activeDoc ? activeDoc.filename : 'Select a document'}
            </span>
            {activeDoc && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                {activeDoc.chunk_count} chunks
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isGuest && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-1.5 rounded-full transition-colors ${i < (5 - guestRequestsLeft) ? 'bg-indigo-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{5 - guestRequestsLeft}/5 used</span>
                <button onClick={() => navigate('/login')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />Upgrade
                </button>
              </div>
            )}
            {messages.length > 0 && !loading && (
              <button onClick={() => { setMessages([]); setSources([]) }} className="text-xs text-gray-400 hover:text-gray-600">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {!activeDoc && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Pick a document from the sidebar</p>
              <p className="text-xs mt-1">Then ask anything about its contents</p>
            </div>
          )}

          {activeDoc && messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Ask anything about <span className="text-indigo-600">{activeDoc.filename}</span>
              </p>
              <p className="text-xs text-gray-400 mb-6">Or pick a suggestion below to get started</p>

              {guestLimitReached ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 max-w-sm">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Free trial used up</p>
                  <p className="text-xs text-amber-700 mb-3">You've used all 5 free questions. Sign in to continue chatting.</p>
                  <button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    Sign In to Continue
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-lg">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-4 text-center">
                    Suggested Questions
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-indigo-200 text-indigo-600 text-sm font-medium bg-white hover:bg-indigo-50 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-50 text-gray-800 rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.role === 'assistant' && msg.content === '' && streamingId === msg.id ? (
                    <TypingDots />
                  ) : msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {streamingId === msg.id && msg.content !== '' && (
                        <span className="inline-block w-0.5 h-3.5 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && streamingId !== msg.id && (
                  <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                    {msg.sources.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setSources(msg.sources!); setShowSources(true) }}
                        className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        Chunk {s.chunk_index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-3 bg-white border-t border-gray-200">
          {guestLimitReached && messages.length > 0 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs text-amber-800 font-medium">Free trial limit reached</p>
              <button onClick={() => navigate('/login')} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">Sign in →</button>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-indigo-300/40 transition-all">
            <div className="flex items-end gap-2 px-4 pt-3 pb-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                disabled={inputDisabled}
                rows={1}
                placeholder={
                  guestLimitReached
                    ? 'Free trial limit reached — sign in to continue'
                    : activeDoc
                      ? `Ask anything about ${activeDoc.filename}…`
                      : 'Select a document first'
                }
                className="flex-1 resize-none bg-transparent text-sm focus:outline-none disabled:text-gray-400 py-0.5"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || inputDisabled}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button disabled={inputDisabled} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button disabled={inputDisabled} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors" title="Attach image">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button disabled={inputDisabled} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors" title="Translate">
                  <Globe className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Powered by Llama 3.3 70B via Groq
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source panel */}
      {showSources && sources.length > 0 && (
        <div className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Sources</span>
            <button onClick={() => setShowSources(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {sources.map((src, i) => (
              <div key={i} className={`rounded-lg border p-3 text-xs ${i === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <ChevronRight className="w-3 h-3 text-indigo-500" />
                  <span className="font-semibold text-gray-700">Chunk {src.chunk_index + 1}</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-mono text-[11px]">{src.content}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Top {sources.length} chunks retrieved</p>
          </div>
        </div>
      )}
    </div>
  )
}
