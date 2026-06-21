import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loginRequest } from '../api/client'

type AuthMode = 'unauthenticated' | 'authenticated' | 'guest'

interface AuthState {
  mode: AuthMode
  username: string | null
  token: string | null
  guestRequestsUsed: number
}

interface AuthContextValue extends AuthState {
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => void
  continueAsGuest: () => void
  consumeGuestRequest: () => boolean
  isAuthenticated: boolean
  isGuest: boolean
  guestRequestsLeft: number
}

const GUEST_REQUEST_LIMIT = 5
const STORAGE_KEY = 'documind_auth'

function load(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AuthState
  } catch {}
  return { mode: 'unauthenticated', username: null, token: null, guestRequestsUsed: 0 }
}

function save(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(load)

  useEffect(() => { save(state) }, [state])

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await loginRequest(username, password)
    setState({ mode: 'authenticated', username: res.username, token: res.access_token, guestRequestsUsed: 0 })
  }, [])

  const signOut = useCallback(() => {
    setState({ mode: 'unauthenticated', username: null, token: null, guestRequestsUsed: 0 })
  }, [])

  const continueAsGuest = useCallback(() => {
    setState((s) => ({ ...s, mode: 'guest', username: null, token: null }))
  }, [])

  const consumeGuestRequest = useCallback((): boolean => {
    if (state.mode !== 'guest') return true
    if (state.guestRequestsUsed >= GUEST_REQUEST_LIMIT) return false
    setState((s) => ({ ...s, guestRequestsUsed: s.guestRequestsUsed + 1 }))
    return true
  }, [state])

  const value: AuthContextValue = {
    ...state,
    isAuthenticated: state.mode === 'authenticated',
    isGuest: state.mode === 'guest',
    guestRequestsLeft: GUEST_REQUEST_LIMIT - state.guestRequestsUsed,
    signIn,
    signOut,
    continueAsGuest,
    consumeGuestRequest,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
