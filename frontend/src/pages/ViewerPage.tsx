import { Download, ExternalLink, FileText, MessageSquare, Share2, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadDocument, getDocumentFileUrl, getDocuments } from '../api/client'
import type { Document } from '../types'

function fmt(bytes: number) {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

const TYPE_LABEL: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', txt: 'TXT' }

export default function ViewerPage() {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Document | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    getDocuments().then((docs) => {
      const found = docs.find((d) => d.doc_id === docId)
      if (found) setDoc(found)
      else navigate('/documents')
    }).catch(() => navigate('/documents'))
  }, [docId, navigate])

  if (!doc) return null

  const fileUrl = getDocumentFileUrl(doc.doc_id)
  const canViewInline = doc.file_type === 'pdf' || doc.file_type === 'txt'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fc]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 h-16 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-indigo-50 rounded-md flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="font-heading font-bold text-gray-900 text-base truncate max-w-xs sm:max-w-md">
            {doc.filename}
          </h2>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500">
            {TYPE_LABEL[doc.file_type] ?? doc.file_type.toUpperCase()}
          </span>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200">
            {fmt(doc.file_size_bytes)}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => navigator.share?.({ title: doc.filename, url: fileUrl })}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
          <button
            onClick={() => downloadDocument(doc.doc_id, doc.filename)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Download</span>
          </button>
          <Link
            to={`/chat/${doc.doc_id}`}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ml-1"
          >
            <MessageSquare className="w-4 h-4" />
            Open Chat
          </Link>
        </div>
      </header>

      {/* ── Main canvas ── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 pb-20">
        {canViewInline ? (
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* gradient accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />
            <div
              className="w-full transition-all duration-200"
              style={{ height: `calc(100vh - 180px)` }}
            >
              <iframe
                key={zoom}
                src={`${fileUrl}#toolbar=1&view=FitH&zoom=${zoom}`}
                title={doc.filename}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoom}%`,
                  height: `${10000 / zoom}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-heading font-bold text-gray-900 text-xl mb-2">Preview not available</h3>
              <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">
                DOCX files can't be previewed in the browser. Download the file to open it, or use Chat to ask questions about it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => downloadDocument(doc.doc_id, doc.filename)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <Link
                  to={`/chat/${doc.doc_id}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Chat
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer toolbar ── */}
      {canViewInline && (
        <footer className="bg-white border-t border-gray-200 flex items-center justify-center h-14 px-6 shrink-0 relative">
          <span className="absolute left-6 text-xs text-gray-400 hidden lg:flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Viewing original file
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-4 py-1.5 rounded-full min-w-[64px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setZoom(100)}
            className="absolute right-6 text-xs text-gray-400 hover:text-indigo-600 transition-colors hidden md:block"
          >
            Reset
          </button>
        </footer>
      )}
    </div>
  )
}
