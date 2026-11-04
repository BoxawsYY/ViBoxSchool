import './Authentication.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/contexts/AuthContext'
import { useTheme } from '../../core/hooks/useTheme'
import Button from '../../core/components/Button/Button'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

const Authentication = () => {
  const navigate = useNavigate()
  const { session, signIn, signUp } = useAuth()
  const { isDarkTheme, setThemePreference } = useTheme()
  const [authenticationMode, setAuthenticationMode] = useState('login')

  useEffect(() => {
    if (session) {
      if (session.user?.roles?.includes('Admin')) {
        navigate('/panel')
      }
      else {
        navigate('/panel')
      }
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
        authenticationMode={authenticationMode}
        setAuthenticationMode={setAuthenticationMode}
        signIn={signIn}
      />

      <RegisterForm
        authenticationMode={authenticationMode}
        setAuthenticationMode={setAuthenticationMode}
        signUp={signUp}
      />

    </div>
  )
}

export default Authentication