import './LoginForm.css'
import { useState } from 'react'
import { useForm } from '../../core/hooks/useForm'
import { LOGIN } from './constants/login.mjs'
import Validator from '../../core/utils/validator.mjs'
import Notify from '../../core/lib/notify.mjs'
import Brand from '../../core/components/Brand/Brand'
import Button from '../../core/components/Button/Button'
import Icon from '../../core/components/Icon/Icon'
import googleIcon from '../../assets/google.png'
import Input from '../../core/components/Input/Input'
import Password from '../../core/components/Password/Password'
import InputGroup from '../../core/components/InputGroup/InputGroup'
import Divider from '../../core/components/Divider/Divider'

const LoginForm = ({ authenticationMode, setAuthenticationMode, signIn }) => {
    const [isLoginWithCredentials, setIsLoginWithCredentials] = useState(false)

    const {
        form,
        errors,
        setErrors,
        handleChange,
        resetForm,
    } = useForm(LOGIN.FORM.INITIAL)

    const validator = new Validator({ prefix: 'Login', errorHandler: setErrors })

    const validateLoginForm = () => {
        const { username, password } = form
        return validator.every([
            ['Username', () => validator.set({ username }).required().length(2, 100)],
            ['Password', () => validator.set({ password }).required().isStrongPassword()]
        ])
    }

    const handler = async (event) => {
        event.preventDefault()

        if (!validateLoginForm()) return false

        const success = await signIn(form)
        if (success) {
            Notify.notice('Se ha iniciado sesión correctamente', 'success')
        }
    }

    const signInWithGoogle = (event) => {
        event.preventDefault()
        Notify.notice('La autenticación con google no está disponible en este momento, ingrese con las credenciales asignadas')
    }

    const handleRegister = () => {
        resetForm()
        setIsLoginWithCredentials(false)
        setAuthenticationMode('register') 
    }

    return (
        <div className={`lx-m-authentication-login ${authenticationMode === 'login' ? '--active' : '--inactive'}`}>
            <div className='lx-m-authentication-login-container'>
                <div className='lx-m-authentication-login-content'>
                    <div className='lx-m-authentication-login-form-greatings'>
                        <span className='lx-m-authentication-login-form-logo'>
                            <Brand size='l' className='lx-m-authentication-login-form-logo-svg' />
                        </span>
                        <br />
                        <p>Accede al sistema para gestionar tus porcinos</p>
                    </div>
                    <form className='lx-m-authentication-login-form'>
                        {isLoginWithCredentials && (
                            <div className='lx-m-authentication-login-form-credentials'>
                                <InputGroup columns='1'>
                                    <Input
                                        required
                                        id='LoginUsername'
                                        name='username'
                                        label='Username'
                                        type='text'
                                        autoComplete='off'
                                        minLength={2}
                                        maxLength={100}
                                        value={form.username}
                                        onChange={handleChange}
                                        error={errors.username}
                                    />
                                    <Password
                                        required
                                        id='LoginPassword'
                                        name='password'
                                        label='Password'
                                        value={form.password}
                                        onChange={handleChange}
                                        error={errors.password}
                                    />
                                </InputGroup>
                                <div className='lx-m-authentication-login-form-remember'>
                                    <input type='checkbox' name='AuthenticationRemember' id='remember' />
                                    <label htmlFor='remember'>Recordar credenciales</label>
                                </div>
                            </div>
                        )}
                        <div className='lx-m-authentication-login-form-actions'>
                            {isLoginWithCredentials
                                ? <Button width='full' color='auto' onClick={handler}>
                                    <Icon name='lock_open' />
                                    Iniciar Sesión
                                </Button>
                                : <Button width='full' onClick={() => setIsLoginWithCredentials(true)}>
                                    <Icon name='badge' />
                                    <span>Iniciar con <strong>Credenciales</strong></span>
                                </Button>
                            }
                            <Divider text='o' />
                            <Button color='auto' width='full' variant='ghost' onClick={signInWithGoogle}>
                                <img src={googleIcon} className='lx-m-authentication-login-form-google-icon' />
                                <span>Iniciar con <strong>Google</strong></span>
                            </Button>
                        </div>
                        <Button size='xs' color='accent' variant='plain' width='full' onClick={handleRegister}>
                            <Icon name='lock_person' />
                            Regístrese
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginForm