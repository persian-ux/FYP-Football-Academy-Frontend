import { useCallback, useEffect, useState } from 'react'

import {
  getStoredSession,
  signInDemo,
  signOutDemo,
  type AuthSession,
  type DemoCredentials,
} from '@/lib/auth'

type DemoAuthState = {
  session: AuthSession | null
  ready: boolean
  signIn: (credentials: DemoCredentials) => AuthSession
  signOut: () => void
}

export function useDemoAuth(): DemoAuthState {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedSession = getStoredSession()
    setSession(storedSession)
    setReady(true)
    console.log('Demo auth bootstrapped', storedSession)
  }, [])

  const signIn = useCallback((credentials: DemoCredentials) => {
    const nextSession = signInDemo(credentials)
    setSession(nextSession)
    return nextSession
  }, [])

  const signOut = useCallback(() => {
    signOutDemo()
    setSession(null)
  }, [])

  return {
    session,
    ready,
    signIn,
    signOut,
  }
}
