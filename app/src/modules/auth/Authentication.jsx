import './Authentication.css'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/contexts/AuthContext'
import { useTheme } from '../../core/hooks/useTheme'
import Button from '../../core/components/Button/Button'
import LoginForm from './LoginForm'

const Authentication = () => {
  const navigate = useNavigate()
  const { session, signIn, signInDemo } = useAuth()
  const { isDarkTheme, setThemePreference } = useTheme()
  useEffect(() => {
    if (session) {
      const roles = Array.isArray(session.user?.roles) ? session.user.roles : []
      const homeByRole = {
        Admin: '/admin/schools',
        Rector: '/panel',
        Secretary: '/panel',
        Guardian: '/panel'
      }
      const destination = roles.map((role) => homeByRole[role]).find(Boolean) || '/panel'
      navigate(destination, { replace: true })
    }
  }, [session, navigate])

  return !session && (
    <div className='lx-m-authentication'>

      <div className='lx-m-authentication-mode'>
        <Button color='auto' variant='plain' size='s' radius='full' icon onClick={() => {
          setThemePreference(isDarkTheme ? 'light' : 'dark')
        }}>
          <span className='material-symbols-rounded' translate='no'>{isDarkTheme ? 'light_mode' : 'dark_mode'}</span>
        </Button>
      </div>

      <LoginForm
        authenticationMode='login'
        signIn={signIn}
        signInDemo={signInDemo}
      />

    </div>
  )
}

export default Authentication