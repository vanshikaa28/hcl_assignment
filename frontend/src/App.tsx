import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Toaster } from "sonner"
import { Landing } from "@/pages/Landing"
import { Login } from "@/pages/Login"
import { Signup } from "@/pages/Signup"
import { Dashboard } from "@/pages/Dashboard"
import { CreatePoll } from "@/pages/CreatePoll"
import { ManagePoll } from "@/pages/ManagePoll"
import { PublicPoll } from "@/pages/PublicPoll"
import { Results } from "@/pages/Results"

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function PublicAuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<Landing />} />

          {/* Guest Only Routes */}
          <Route element={<PublicAuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/polls" element={<Dashboard />} />
            <Route path="/polls/create" element={<CreatePoll />} />
            <Route path="/polls/:id/manage" element={<ManagePoll />} />
          </Route>

          {/* Public Poll & Results */}
          <Route path="/p/:shareCode" element={<PublicPoll />} />
          <Route path="/p/:shareCode/results" element={<Results />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
