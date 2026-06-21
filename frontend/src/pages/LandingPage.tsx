import { ArrowRight, BookOpen, FileText, MessageSquare, Shield, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: FileText,
    title: 'Upload Any Document',
    desc: 'PDF, DOCX, or TXT — up to 10 MB. Text is extracted, chunked, and indexed instantly.',
  },
  {
    icon: MessageSquare,
    title: 'Chat With Your Content',
    desc: 'Ask anything in plain English. Get precise answers drawn directly from your document.',
  },
  {
    icon: BookOpen,
    title: 'Source Citations',
    desc: 'Every answer links back to the exact chunk it came from. No hallucinations.',
  },
  {
    icon: Zap,
    title: 'Powered by Groq',
    desc: 'Llama 3.3 70B running at ~280 tokens/sec. Answers in under a second.',
  },
  {
    icon: Shield,
    title: 'Private by Default',
    desc: 'Your files are processed locally and never stored after embedding.',
  },
  {
    icon: Sparkles,
    title: 'Smart Suggestions',
    desc: 'Not sure what to ask? Starter questions help you explore documents faster.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-gray-900 text-lg">DocuMind</span>
        </div>
        <Link
          to="/login"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-3xl mx-auto">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          AI-Powered Document Chat
        </span>
        <h1 className="font-heading font-bold text-5xl text-gray-900 leading-tight mb-5">
          Chat with your documents,<br />get answers instantly.
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
          Upload a PDF, DOCX, or TXT file and ask anything about it. DocuMind finds the answer and shows exactly where it came from.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            Try for Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-3 transition-colors"
          >
            See how it works
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">No sign up required · 5 free questions as a guest</p>
      </section>

      {/* Hero visual */}
      <div className="mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="bg-surface border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Mock chat UI */}
          <div className="flex border-b border-gray-100 bg-white px-5 py-3 items-center gap-2">
            <div className="w-4 h-4 bg-indigo-100 rounded flex items-center justify-center shrink-0">
              <FileText className="w-2.5 h-2.5 text-indigo-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Q4_Financial_Report.pdf</span>
            <span className="ml-auto text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">Ready</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-end">
              <div className="bg-indigo-50 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-800 max-w-xs">
                What was the total revenue in Q4?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 max-w-sm shadow-sm">
                The total revenue in Q4 was <span className="font-semibold text-gray-900">$4.2 million</span>, representing a 18% increase year-over-year.
                <div className="mt-2">
                  <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                    📄 Chunk 3
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-indigo-50 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-800 max-w-xs">
                Which product line drove the most growth?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 max-w-sm shadow-sm">
                The <span className="font-semibold text-gray-900">Enterprise tier</span> drove the most growth at 34%, primarily due to three new key accounts onboarded in October.
                <div className="mt-2">
                  <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                    📄 Chunk 7
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="bg-surface py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-gray-900 text-center mb-3">Everything you need</h2>
          <p className="text-gray-500 text-center mb-12">Built for speed, accuracy, and privacy.</p>
          <div className="grid grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="font-heading font-semibold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="font-heading font-bold text-3xl text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-gray-500 mb-8">No account needed. Try it free with 5 questions.</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-sm"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium text-gray-500">DocuMind</span>
        </div>
        <p>Powered by Llama 3.3 70B · Groq · ChromaDB</p>
      </footer>
    </div>
  )
}
