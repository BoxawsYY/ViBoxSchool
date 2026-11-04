import { createContext, useContext, useEffect, useState } from 'react'
import API from '../config/api.config.mjs'
import Notify from '../lib/notify.mjs'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('session')
    return stored ? JSON.parse(stored) : null
  })

  const user = session?.user || {}

  const signIn = async ({ username, password }) => {
    try {
      const result = await fetch(API.AUTH.ENDPOINTS.SIGNIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!result.ok) {
        const error = await result.json()
        Notify.notice(error.message || 'Credenciales incorrectas', 'error')
        return null
      }

      const data = await result.json()
      const sessionData = {
        token: data.token,
        user: data.user,
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

  const signUp = async (userData) => {
    try {
      // Firebase Storage está deshabilitado (requiere plan Blaze de pago).
      // Se omite la subida de imagen por ahora; se migrará a Supabase Storage.
      const image = null

      const result = await fetch(API.AUTH.ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userData, image }),
      })

      if (!result.ok) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error en signUp:', error)
      Notify.notice('Error al crear cuenta', 'error')
      return false
    }
  }

  const signOut = async () => {
    try {
      const result = await fetch(API.AUTH.ENDPOINTS.SIGNOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.token}`
        }
      })
    } catch (error) {
      Notify.notice('Error al cerrar sesión', 'error')
    }
    localStorage.removeItem('session')
    setSession(null)
    Notify.notice('Sesión cerrada', 'info')
  }

  const validateSession = async () => {
    const stored = localStorage.getItem('session')
    if (stored) {
      const result = await fetch(API.AUTH.ENDPOINTS.SESSION, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${JSON.parse(stored).token}`
        }
      })
      if (result.ok) {
        const data = await result.json()
        const sessionData = {
          token: JSON.parse(stored).token,
          user: data.user,
        }
        localStorage.setItem('session', JSON.stringify(sessionData))
        setSession(sessionData)
        return
      }
    } else {
      setSession(null)
    }
  }

  const hasAuthorities = (session = null, authorities = {}) => {
    if (!session || !session.user) return false

    const userRoles = session.user.roles || []
    const userPermissions = session.user.permissions || []

    if (session.user.role) userRoles.push(session.user.role)

    const { roles = [], permissions = [] } = authorities

    const hasRoles = roles.length > 0 ? roles.some(role => userRoles.includes(role)) : true
    const hasPermissions = permissions.every(permission => userPermissions.includes(permission))

    return hasRoles && hasPermissions
  }

  useEffect(() => {
    validateSession()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut, hasAuthorities }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
