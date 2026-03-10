import { Navigate } from 'react-router-dom'
import { useUserRole } from '@/hooks/useUserRole'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdminOrModerator, loading } = useUserRole()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAdminOrModerator) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
