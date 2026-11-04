import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Unauthorized from '../../pages/Unauthorized/Unauthorized.jsx'

const ProtectedRoute = ({ children, authorities = {} }) => {
  const { session, hasAuthorities } = useAuth()

  if (!session) {
    return <Navigate to='/auth' replace />
  }

  const authorized = hasAuthorities(session, authorities)

  if (!authorized) {
    return <Unauthorized />
  }

  return children
}

export default ProtectedRoute