import { Eye, EyeOff, FileText, Loader2, Lock, MessageSquare, Sparkles, Upload, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    try {
      await signIn(username.trim(), password)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    continueAsGuest()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="w-[40%] bg-indigo-600 flex flex-col justify-between p-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-heading font-bold text-xl">DocuMind</span>
        </div>

        <div>
          <h2 className="text-white font-heading font-bold text-3xl leading-snug mb-6">
            Chat with your documents, <br />get answers instantly.
          </h2>
          <ul className="space-y-4">
            {[
              { icon: Upload, text: 'Upload PDF, DOCX & TXT files' },
              { icon: MessageSquare, text: 'AI answers grounded in your docs' },
              { icon: Sparkles, text: 'Source citations on every reply' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <div className="w-7 h-7 bg-white/15 rounded-md flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Free trial card */}
        <div className="bg-white/15 border border-white/25 rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-1">Free Trial</p>
          <p className="text-white/80 text-xs leading-relaxed">
            Browse existing documents and use chat for up to 5 questions — no sign in needed.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-surface flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-6">Sign In</h1>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              onClick={handleGuest}
              className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Continue as Guest (Free Trial)
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Browse docs · 5 free chat messages · no uploads</p>
          </div>
        </div>
      </div>
    </div>
  )
}
