import { Download, Eye, FileText, HelpCircle, Loader2, MessageSquare, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDocument, downloadDocument, getDocuments } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Document } from '../types'

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TYPE_COLORS: Record<string, { icon: string; bg: string }> = {
  pdf: { icon: 'text-red-500', bg: 'bg-red-50' },
  docx: { icon: 'text-blue-500', bg: 'bg-blue-50' },
  txt: { icon: 'text-gray-500', bg: 'bg-gray-100' },
}

export default function DocumentsPage() {
  const { isGuest } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = () => getDocuments().then(setDocs).catch(() => {})
  useEffect(() => { refresh() }, [])

  const handleDelete = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteDocument(id)
      setDeleteId(null)
      refresh()
    } finally {
      setDeleting(false)
    }
  }

  const filtered = docs.filter((d) => {
    const matchSearch = d.filename.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.file_type === filter
    return matchSearch && matchFilter
  })

  const totalStorage = docs.reduce((s, d) => s + d.file_size_bytes, 0)
  const storagePct = Math.min((totalStorage / (100 * 1_048_576)) * 100, 100)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-gray-900 tracking-tight">My Documents</h1>
          <p className="text-gray-500 mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
        >
          + Upload New
        </Link>
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by name…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
            />
          </div>

          {/* Filter tabs (underline style) */}
          <div className="flex gap-0 border-b border-gray-200 mb-6">
            {['all', 'pdf', 'docx', 'txt'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-5 py-2.5 text-sm font-medium capitalize -mb-px transition-colors ${
                  filter === t
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t === 'all' ? 'All Files' : t.toUpperCase()}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center shadow-sm">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No documents found</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                {search ? 'Try a different search term' : 'Upload your first document to get started'}
              </p>
              <Link to="/upload" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Upload a document →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((doc) => {
                const colors = TYPE_COLORS[doc.file_type] ?? { icon: 'text-gray-500', bg: 'bg-gray-100' }
                return (
                  <div
                    key={doc.doc_id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all relative"
                  >
                    {/* Delete overlay */}
                    {!isGuest && deleteId === doc.doc_id && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10 p-6 border-2 border-red-200">
                        <Trash2 className="w-8 h-8 text-red-400 mb-2" />
                        <p className="text-sm font-bold text-gray-800 mb-1 text-center">Delete this document?</p>
                        <p className="text-xs text-gray-500 mb-4 text-center">This action cannot be undone.</p>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleDelete(doc.doc_id)}
                            disabled={deleting}
                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            {deleting ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                            ) : 'Delete'}
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            disabled={deleting}
                            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Header: icon + badge */}
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                        <FileText className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    </div>

                    {/* Title + meta */}
                    <div>
                      <p className="text-base font-bold text-gray-900 truncate" title={doc.filename}>{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-1">{fmt(doc.file_size_bytes)} · {doc.chunk_count} chunks · {fmtDate(doc.created_at)}</p>
                    </div>

                    {/* View + Open Chat */}
                    <Link
                      to={`/documents/${doc.doc_id}/view`}
                      className="w-full py-2.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-sm font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      to={`/chat/${doc.doc_id}`}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Chat
                    </Link>

                    {/* Action icons */}
                    <div className="flex items-center justify-around pt-3 border-t border-gray-100">
                      <Link
                        to={`/documents/${doc.doc_id}/view`}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="View document"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => downloadDocument(doc.doc_id, doc.filename)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!isGuest && (
                        <button
                          onClick={() => setDeleteId(doc.doc_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: Workspace Stats */}
        <div className="w-64 shrink-0 space-y-5">
          <h3 className="font-heading font-bold text-gray-900 text-lg">Workspace Stats</h3>

          {/* Storage card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Storage Used</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-extrabold text-gray-900">{fmt(totalStorage)}</span>
              <span className="text-xs text-gray-400 mb-1">/ 100 MB</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{storagePct.toFixed(0)}% of free plan used</p>
          </div>

          {/* Total docs card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Documents</p>
            <p className="text-4xl font-extrabold text-gray-900">{docs.length}</p>
            <p className="text-xs text-gray-400 mt-1">documents uploaded</p>
          </div>

          {/* Total chats placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Chats</p>
            <p className="text-4xl font-extrabold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">conversations started</p>
          </div>

          {/* Support center */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-bold text-gray-700">Support Center</p>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Get help with uploads, chat settings, and account management.
            </p>
            <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
              Visit Help Docs →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
