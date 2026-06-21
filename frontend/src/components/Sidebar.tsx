import {
  FileText,
  FolderOpen,
  Home,
  LogOut,
  MessageSquare,
  Upload,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', guestHidden: false },
  { to: '/upload', icon: Upload, label: 'Upload', guestHidden: false },
  { to: '/documents', icon: FolderOpen, label: 'My Documents', guestHidden: false },
  { to: '/chat', icon: MessageSquare, label: 'Chat', guestHidden: false },
]

export default function Sidebar() {
  const { isAuthenticated, isGuest, username, guestRequestsLeft, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="font-heading font-bold text-gray-900 text-lg">DocuMind</span>
      </div>

      {/* Guest trial banner */}
      {isGuest && (
        <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-amber-800">Free Trial</p>
          <p className="text-xs text-amber-700 mt-0.5">{guestRequestsLeft} of 5 chat questions left</p>
          <div className="mt-1.5 h-1 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${((5 - guestRequestsLeft) / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.filter(({ guestHidden }) => !(isGuest && guestHidden)).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/chat' ? false : true}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600 pl-[10px]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-1">
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
            {isAuthenticated ? (username?.[0]?.toUpperCase() ?? 'U') : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">
              {isAuthenticated ? username : 'Guest'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isAuthenticated ? 'Signed in' : 'Free trial'}
            </p>
          </div>
          <button onClick={handleSignOut} title="Sign out" className="text-gray-400 hover:text-gray-600 shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
