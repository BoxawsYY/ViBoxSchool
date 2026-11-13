import './LoginForm.css'
import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Notify from '../../core/lib/notify.mjs'
import PlatformLogo from '../../core/components/PlatformLogo/PlatformLogo'

const DEMO_ACCOUNTS = [
    { label: 'Padre de Familia', profile: 'parent', role: 'Guardian' },
    { label: 'Secretaría', profile: 'secretary', role: 'Secretary' },
    { label: 'Rector', profile: 'principal', role: 'Rector' },
    { label: 'Administrador', profile: 'admin', role: 'Admin' }
]

const LoginForm = ({ authenticationMode, signIn, signInDemo }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState(null)

    const handler = async (event) => {
        event.preventDefault()
        if (!selectedAccount) {
            Notify.notice('Selecciona el rol con el que deseas ingresar', 'error')
            return
        }

        if (!username.trim() && !password) {
            setSubmitting(true)
            try {
                await signInDemo(selectedAccount.profile, selectedAccount.role)
            } finally {
                setSubmitting(false)
            }
            return
        }

        if (!username.trim() || !password) {
            Notify.notice('Ingresa tu correo o usuario y contraseña', 'error')
            return
        }

        setSubmitting(true)
        try {
            await signIn({ username: username.trim(), password, role: selectedAccount.role })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={`lx-m-authentication-login ${authenticationMode === 'login' ? '--active' : '--inactive'}`}>
            <section className='lx-m-authentication-login-container' aria-labelledby='lx-login-title'>
                <div className='lx-m-authentication-login-content'>
                    <PlatformLogo className='lx-m-authentication-login-brand' />
                    <div className='lx-m-authentication-login-heading'>
                        <h1 id='lx-login-title'>Ingresar a ViBoxSchool</h1>
                        <p>Selecciona tu rol e ingresa tus credenciales.</p>
                    </div>

                    <form className='lx-m-authentication-login-form' onSubmit={handler}>
                        <label htmlFor='LoginUsername'>Correo electrónico o usuario</label>
                        <input
                            id='LoginUsername'
                            name='username'
                            type='text'
                            autoComplete='username'
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            required={!selectedAccount}
                        />

                        <label htmlFor='LoginPassword'>Contraseña</label>
                        <div className='lx-m-authentication-password-field'>
                            <input
                                id='LoginPassword'
                                name='password'
                                type={passwordVisible ? 'text' : 'password'}
                                autoComplete='current-password'
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required={!selectedAccount}
                            />
                            <button
                                className='lx-m-authentication-password-toggle'
                                type='button'
                                aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-controls='LoginPassword'
                                aria-pressed={passwordVisible}
                                onClick={() => setPasswordVisible((visible) => !visible)}
                            >
                                <span className='material-symbols-rounded' aria-hidden='true'>
                                    {passwordVisible ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>

                        <button className='lx-m-authentication-login-submit' type='submit' disabled={submitting}>
                            {submitting ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>

                    <div className='lx-m-authentication-demo'>
                        <h2>Selecciona un rol</h2>
                        <div className='lx-m-authentication-demo-grid'>
                            {DEMO_ACCOUNTS.map((account) => (
                                <button
                                    key={account.profile}
                                    type='button'
                                    aria-pressed={selectedAccount?.profile === account.profile}
                                    className={selectedAccount?.profile === account.profile ? 'is-selected' : ''}
                                    onClick={() => setSelectedAccount(account)}
                                    disabled={submitting}
                                >
                                    {account.label}
                                </button>
                            ))}
                        </div>
                        <p>Los botones solo seleccionan el rol. Presiona “Ingresar” para iniciar sesión o acceder al perfil de prueba.</p>
                    </div>
                    <Link className='lx-m-authentication-home' to='/'>Volver al inicio</Link>
                </div>
            </section>
        </div>
    )
}

LoginForm.propTypes = {
    authenticationMode: PropTypes.string.isRequired,
    signIn: PropTypes.func.isRequired,
    signInDemo: PropTypes.func.isRequired
}

export default LoginForm
