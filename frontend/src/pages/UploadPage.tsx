import {
  CheckCircle2,
  CloudUpload,
  Eye,
  FileText,
  Lightbulb,
  Lock,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteDocument, getDocuments, uploadDocument } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Document } from '../types'

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

type UploadStage = 'uploading' | 'processing' | 'complete' | 'error'

interface UploadState {
  name: string
  stage: UploadStage
  progress: number
  error?: string
}

const TYPE_ICON: Record<string, { color: string }> = {
  pdf: { color: 'text-red-500' },
  docx: { color: 'text-blue-500' },
  txt: { color: 'text-gray-500' },
}

export default function UploadPage() {
  const { isGuest, canGuestUpload, consumeGuestUpload } = useAuth()
  const navigate = useNavigate()
  const guestLocked = isGuest && !canGuestUpload
  const [docs, setDocs] = useState<Document[]>([])
  const [uploadState, setUploadState] = useState<UploadState | null>(null)
  const [dragging, setDragging] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalStorage = docs.reduce((s, d) => s + d.file_size_bytes, 0)
  const storagePct = Math.min((totalStorage / (100 * 1_048_576)) * 100, 100)

  const refresh = () => getDocuments().then(setDocs).catch(() => {})
  useEffect(() => { refresh() }, [])

  const handleFile = useCallback(async (file: File) => {
    setUploadState({ name: file.name, stage: 'uploading', progress: 0 })
    try {
      await uploadDocument(file, (pct) => {
        setUploadState((u) =>
          u ? { ...u, progress: pct, stage: pct >= 100 ? 'processing' : 'uploading' } : u,
        )
      })
      setUploadState((u) => u ? { ...u, stage: 'complete', progress: 100 } : u)
      if (isGuest) consumeGuestUpload()
      await refresh()
      setTimeout(() => setUploadState(null), 2500)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Upload failed. Please try again.'
      setUploadState((u) => u ? { ...u, stage: 'error', error: msg } : u)
    }
  }, [isGuest, consumeGuestUpload])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (guestLocked) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDelete = async (id: string) => {
    await deleteDocument(id)
    setDeleteId(null)
    refresh()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Guest banner */}
      {isGuest && (
        <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-8 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              {canGuestUpload
                ? <><span className="font-semibold">Free Trial</span> — Upload 1 document to test the full experience.</>
                : <><span className="font-semibold">Upload limit reached</span> — Sign in to upload more documents.</>
              }
            </p>
          </div>
          <button onClick={() => navigate('/login')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 shrink-0 ml-4">
            Sign In →
          </button>
        </div>
      )}

      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl font-heading font-extrabold text-gray-900 tracking-tight">Upload a Document</h1>
                <p className="text-gray-500 mt-2">Analyze your PDFs, reports, and notes with AI-powered precision.</p>
              </div>

              {/* Drop zone */}
              <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm relative">
                <div
                  onDragOver={(e) => { e.preventDefault(); if (!guestLocked) setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => { if (!guestLocked) fileInputRef.current?.click() }}
                  className={`rounded-lg p-12 flex flex-col items-center justify-center text-center border-2 border-dashed transition-colors ${
                    guestLocked
                      ? 'border-gray-200 bg-gray-50 cursor-default'
                      : dragging
                        ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                        : 'border-gray-300 hover:bg-gray-50 hover:border-indigo-400 cursor-pointer'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  />
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110 ${
                    guestLocked ? 'bg-gray-100' : 'bg-indigo-50'
                  }`}>
                    <CloudUpload className={`w-8 h-8 ${guestLocked ? 'text-gray-300' : 'text-indigo-500'}`} />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${guestLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                    Drop your file here or browse
                  </h3>
                  <p className={`text-sm mb-4 ${guestLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                    Drag and drop any document to get started
                  </p>
                  <div className="flex gap-2 mb-6">
                    {['PDF', 'DOCX', 'TXT'].map((t) => (
                      <span key={t} className={`px-3 py-1 rounded text-xs font-medium ${
                        guestLocked ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>{t}</span>
                    ))}
                  </div>
                  {!guestLocked && (
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      Select Files
                    </button>
                  )}
                </div>

                {/* Guest upload limit overlay */}
                {guestLocked && (
                  <div className="absolute inset-1 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="font-heading font-semibold text-gray-900 text-base">Free upload used</p>
                    <p className="text-sm text-gray-500 mt-1 mb-4 text-center max-w-xs">
                      You've used your 1 free document upload. Sign in to upload unlimited documents.
                    </p>
                    <button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                      Sign In to Continue
                    </button>
                  </div>
                )}
              </div>

              {/* Upload progress card */}
              {uploadState && (
                <div className={`rounded-xl border px-5 py-4 ${
                  uploadState.stage === 'error'
                    ? 'bg-red-50 border-red-200'
                    : uploadState.stage === 'complete'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-indigo-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${
                        uploadState.stage === 'error' ? 'text-red-400' :
                        uploadState.stage === 'complete' ? 'text-emerald-500' : 'text-indigo-500'
                      }`} />
                      <p className="text-sm font-medium text-gray-800 truncate">{uploadState.name}</p>
                    </div>
                    {uploadState.stage === 'error' && (
                      <button onClick={() => setUploadState(null)} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {uploadState.stage === 'complete' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />
                    )}
                  </div>
                  {uploadState.stage === 'error' ? (
                    <p className="text-sm text-red-600">{uploadState.error}</p>
                  ) : uploadState.stage === 'uploading' ? (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="text-indigo-600 font-medium">Uploading...</span>
                        <span>{uploadState.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${uploadState.progress}%` }} />
                      </div>
                    </div>
                  ) : uploadState.stage === 'processing' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full animate-pulse w-full" />
                      </div>
                      <span className="text-xs text-indigo-500 shrink-0">Embedding…</span>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-600 font-medium">Document is ready to chat!</p>
                  )}
                </div>
              )}

              {/* Your Documents (table) */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold text-gray-900">Your Documents</h2>
                  <Link to="/documents" className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1">
                    View all →
                  </Link>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Document Name</th>
                        <th className="px-6 py-4 font-semibold">Size</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {docs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                            No documents yet. Upload one above.
                          </td>
                        </tr>
                      ) : (
                        docs.map((doc) => (
                          <tr key={doc.doc_id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText className={`w-5 h-5 ${TYPE_ICON[doc.file_type]?.color ?? 'text-gray-400'}`} />
                                <span className="font-medium text-gray-800 text-sm">{doc.filename}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{fmt(doc.file_size_bytes)}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Ready
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {deleteId === doc.doc_id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleDelete(doc.doc_id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-md font-medium">Delete</button>
                                  <button onClick={() => setDeleteId(null)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md font-medium">Cancel</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-3 text-gray-400">
                                  <Link to={`/documents/${doc.doc_id}/view`} className="hover:text-indigo-600 transition-colors" title="View document">
                                    <Eye className="w-[18px] h-[18px]" />
                                  </Link>
                                  {!isGuest && (
                                    <button onClick={() => setDeleteId(doc.doc_id)} className="hover:text-red-500 transition-colors" title="Delete">
                                      <Trash2 className="w-[18px] h-[18px]" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-6">
              {/* Pro Tips */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-heading font-bold text-gray-900">Pro Tips</h2>
                </div>
                <ul className="space-y-5">
                  {[
                    { title: 'Ask specific questions', desc: 'Instead of "summarize," try "What are the main risks mentioned in section 4?"' },
                    { title: 'Format matters', desc: 'DocuMind works best with text-heavy documents and clear headings.' },
                    { title: 'Multi-doc analysis', desc: 'Upload multiple documents to compare data points across your library.' },
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tip.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tip.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Workspace usage */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-heading font-bold text-gray-900 mb-4">Workspace usage</h2>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 font-medium">Storage used</span>
                  <span className="text-xs font-bold text-gray-800">{fmt(totalStorage)} / 100 MB</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${storagePct}%` }} />
                </div>
                <p className="text-xs text-gray-400">{storagePct.toFixed(0)}% of 100 MB used</p>
              </div>

              {/* AI Document Insights promo */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 text-white shadow-lg">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">AI Document Insights</h3>
                  <p className="text-sm text-indigo-100 leading-relaxed mb-4">
                    Unlock automated summaries and sentiment analysis for every document you upload. Get deeper insights in seconds.
                  </p>
                  <button className="inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all">
                    Learn more →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center py-6 px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3 md:mb-0">
            <span className="font-heading font-bold text-gray-800">DocuMind AI</span>
            <span className="text-xs text-gray-400">© 2024 DocuMind AI. All rights reserved.</span>
          </div>
          <nav className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Security', 'Help Center'].map((l) => (
              <a key={l} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer">{l}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
