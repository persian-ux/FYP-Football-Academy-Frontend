import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Dashboard from './pages/Dashboard.tsx'
import HubPage from './pages/HubPage.tsx'
import { useDemoAuth } from './hooks/useDemoAuth.ts'

function App() {
  const auth = useDemoAuth()

  if (!auth.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0f1419] text-white">
        <div className="rounded-3xl border border-border/70 bg-card/60 px-6 py-4 text-sm text-muted-foreground backdrop-blur-xl">
          Loading Sportsphere Hub...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HubPage
              session={auth.session}
              onSignIn={auth.signIn}
              onSignOut={auth.signOut}
            />
          }
        />
        <Route
          path="/dashboard"
          element={auth.session ? <Dashboard session={auth.session} onLogout={auth.signOut} /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
