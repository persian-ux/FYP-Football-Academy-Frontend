export type DemoCredentials = {
  email: string
  password: string
}

export type AuthSession = {
  email: string
  displayName: string
}

export const demoCredentials: DemoCredentials = {
  email: 'demo@sportsphere.academy',
  password: 'Sportsphere123!',
}

const authKey = 'sportsphere-demo-session'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function getStoredSession() {
  if (!canUseStorage()) {
    return null
  }

  try {
    const rawSession = window.localStorage.getItem(authKey)
    return rawSession ? (JSON.parse(rawSession) as AuthSession) : null
  } catch (error) {
    console.log('Auth storage read failed', error)
    return null
  }
}

export function signInDemo(credentials: DemoCredentials) {
  if (
    credentials.email.trim().toLowerCase() !== demoCredentials.email ||
    credentials.password !== demoCredentials.password
  ) {
    throw new Error('Use the demo credentials shown in the dialog.')
  }

  const session: AuthSession = {
    email: demoCredentials.email,
    displayName: 'Sportsphere Admin',
  }

  if (canUseStorage()) {
    window.localStorage.setItem(authKey, JSON.stringify(session))
  }

  console.log('Demo auth sign-in succeeded', session)

  return session
}

export function signOutDemo() {
  if (canUseStorage()) {
    window.localStorage.removeItem(authKey)
  }

  console.log('Demo auth signed out')
}
