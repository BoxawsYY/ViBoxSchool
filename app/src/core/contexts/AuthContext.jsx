import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import API from '../config/api.config.mjs'
import Notify from '../lib/notify.mjs'

const AuthContext = createContext()

const readStoredSession = () => {
  try {
    const stored = localStorage.getItem('session')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('session')
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession)

  const user = session?.user || {}

  const signIn = async ({ username, password, role }) => {
    try {
      const result = await fetch(API.AUTH.ENDPOINTS.SIGNIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      })

      if (!result.ok) {
        const error = await result.json()
        Notify.notice(error.message || 'Credenciales incorrectas', 'error')
        return null
      }

      const data = await result.json()
      const sessionData = {
        token: data.token,
        user: {
          ...data.user,
          roles: Array.isArray(data.user?.roles)
            ? data.user.roles
            : data.user?.role ? [data.user.role] : [],
          permissions: Array.isArray(data.user?.permissions) ? data.user.permissions : []
        },
      }

      if (role && !sessionData.user.roles.includes(role)) {
        Notify.notice('El usuario no tiene el rol seleccionado', 'error')
        return null
      }

      localStorage.setItem('session', JSON.stringify(sessionData))
      setSession(sessionData)

      return sessionData
    } catch (error) {
      console.error('Error en signIn:', error)
      Notify.notice('No se pudo iniciar sesión', 'error')
      return null
    }
  }

  const signInDemo = async (profile, expectedRole) => {
    try {
      const result = await fetch(API.AUTH.ENDPOINTS.DEMO_SIGNIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      })

      const data = await result.json()
      if (!result.ok) {
        Notify.notice(data.message || 'No se pudo iniciar la sesión de prueba', 'error')
        return null
      }

      const sessionData = {
        token: data.token,
        user: {
          ...data.user,
          roles: Array.isArray(data.user?.roles)
            ? data.user.roles
            : data.user?.role ? [data.user.role] : [],
          permissions: Array.isArray(data.user?.permissions) ? data.user.permissions : []
        }
      }
      if (expectedRole && !sessionData.user.roles.includes(expectedRole)) {
        Notify.notice('El perfil no tiene el rol seleccionado', 'error')
        return null
      }
      localStorage.setItem('session', JSON.stringify(sessionData))
      setSession(sessionData)
      return sessionData
    } catch (error) {
      console.error('Error en signInDemo:', error)
      Notify.notice('No se pudo iniciar la sesión de prueba', 'error')
      return null
    }
  }

  const signOut = async () => {
    try {
      await fetch(API.AUTH.ENDPOINTS.SIGNOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.token}`
        }
      })
    } catch {
      Notify.notice('Error al cerrar sesión', 'error')
    }
    localStorage.removeItem('session')
    setSession(null)
    Notify.notice('Sesión cerrada', 'info')
  }

  const validateSession = async () => {
    const stored = readStoredSession()
    if (!stored?.token) {
      setSession(null)
      return
    }

    try {
      const result = await fetch(API.AUTH.ENDPOINTS.SESSION, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': stored.token
        }
      })
      if (!result.ok) {
        localStorage.removeItem('session')
        setSession(null)
        return
      }

      const data = await result.json()
      const sessionData = {
        token: stored.token,
        user: {
          ...data.user,
          roles: Array.isArray(data.user?.roles)
            ? data.user.roles
            : data.user?.role ? [data.user.role] : [],
          permissions: Array.isArray(data.user?.permissions) ? data.user.permissions : []
        }
      }
      localStorage.setItem('session', JSON.stringify(sessionData))
      setSession(sessionData)
    } catch (error) {
      console.error('Error al validar la sesión:', error)
    }
  }

  const hasAuthorities = (session = null, authorities = {}) => {
    if (!session || !session.user) return false

    const userRoles = [
      ...(Array.isArray(session.user.roles) ? session.user.roles : []),
      ...(session.user.role ? [session.user.role] : [])
    ]
    const userPermissions = Array.isArray(session.user.permissions)
      ? session.user.permissions
      : []

    const { roles = [], permissions = [] } = authorities

    const hasRoles = roles.length > 0 ? roles.some(role => userRoles.includes(role)) : true
    const hasPermissions = permissions.every(permission => userPermissions.includes(permission))

    return hasRoles && hasPermissions
  }

  useEffect(() => {
    validateSession()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, signIn, signInDemo, signOut, hasAuthorities }}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const useAuth = () => useContext(AuthContext)
