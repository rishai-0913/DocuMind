import { ArrowRight, Clock, FileText, HardDrive, Lock, MessageSquare, Upload, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDocuments } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Document } from '../types'

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_COLOR: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50',
  docx: 'text-blue-500 bg-blue-50',
  txt: 'text-gray-500 bg-gray-100',
}

export default function Dashboard() {
  const { username, isGuest, canGuestUpload } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])

  useEffect(() => {
    getDocuments().then(setDocs).catch(() => {})
  }, [])

  const totalStorage = docs.reduce((s, d) => s + d.file_size_bytes, 0)
  const storagePct = Math.min((totalStorage / (100 * 1_048_576)) * 100, 100)
  const recent = docs.slice(0, 5)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold text-gray-900 tracking-tight">
          {greeting()}{username ? `, ${username}` : ''} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documents</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">{docs.length}</p>
              <p className="text-sm text-gray-400 mt-1">uploaded</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Storage Used</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">{fmt(totalStorage)}</p>
              <p className="text-sm text-gray-400 mt-1">of 100 MB</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${storagePct}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Model</p>
              <p className="text-lg font-extrabold text-gray-900 mt-2 leading-tight">Llama 3.3<br />70B</p>
              <p className="text-sm text-gray-400 mt-1">via Groq</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-5">
        <div className="relative">
          <Link
            to={isGuest && !canGuestUpload ? '#' : '/upload'}
            onClick={(e) => (isGuest && !canGuestUpload) && e.preventDefault()}
            className={`group flex items-center gap-4 bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 transition-all ${isGuest && !canGuestUpload ? 'opacity-50 blur-[1px] pointer-events-none select-none' : 'hover:bg-indigo-700 hover:shadow-indigo-500/40'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-lg">Upload a Document</p>
              <p className="text-sm text-indigo-200 mt-0.5">PDF, DOCX, or TXT — up to 10 MB</p>
            </div>
            <ArrowRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform shrink-0" />
          </Link>
          {isGuest && !canGuestUpload && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-900/60 backdrop-blur-[2px]">
              <Lock className="w-5 h-5 text-white mb-1.5" />
              <p className="text-sm font-semibold text-white">Requires full access</p>
            </div>
          )}
        </div>
        <Link
          to="/chat"
          className="group flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-lg text-gray-900">Start Chatting</p>
            <p className="text-sm text-gray-500 mt-0.5">Ask anything about your documents</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      </div>

      {/* Recent Documents + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-heading font-bold text-gray-900">Recent Documents</h2>
            <Link to="/documents" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No documents yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Upload your first document to get started</p>
              <Link to="/upload" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                <Upload className="w-4 h-4" /> Upload Now
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recent.map((doc) => (
                <li key={doc.doc_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLOR[doc.file_type] ?? 'text-gray-500 bg-gray-100'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{doc.filename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(doc.file_size_bytes)} · {timeAgo(doc.created_at)}</p>
                  </div>
                  <Link
                    to={`/chat/${doc.doc_id}`}
                    className="text-xs border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0"
                  >
                    Open Chat
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Activity (1/3) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-bold text-gray-900 mb-6">Recent Activity</h2>
          {docs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-1 bottom-1 w-px bg-gray-100" />
              <ul className="space-y-5 relative">
                {docs.slice(0, 4).map((doc, i) => (
                  <li key={doc.doc_id} className="flex gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-white relative z-10 shrink-0 ${i === 0 ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                      <Upload className={`w-3.5 h-3.5 ${i === 0 ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        Uploaded <span className="font-semibold truncate block max-w-[140px]">{doc.filename}</span>
                      </p>
                      <span className="text-[11px] text-gray-400">{timeAgo(doc.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
