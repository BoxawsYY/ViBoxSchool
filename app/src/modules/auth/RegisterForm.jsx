import './RegisterForm.css'
import { useEffect, useRef, useState } from 'react'
import { useForm } from '../../core/hooks/useForm' 
import { REGISTER } from './constants/register.mjs'
import Validator from '../../core/utils/validator.mjs'
import Notify from '../../core/lib/notify.mjs'
import Brand from '../../core/components/Brand/Brand'
import Logo from '../../core/components/Logo/Logo'
import Button from '../../core/components/Button/Button'
import Icon from '../../core/components/Icon/Icon'
import Input from '../../core/components/Input/Input'
import Password from '../../core/components/Password/Password'
import InputGroup from '../../core/components/InputGroup/InputGroup'
import Select from '../../core/components/Select/Select'

const RegisterForm = ({ authenticationMode, setAuthenticationMode, signUp }) => {
    const imageInputRef = useRef(null)
    const [step, setStep] = useState(1)

    const {
        form,
        errors,
        setForm,
        setErrors,
        handleChange,
        resetForm,
    } = useForm(REGISTER.FORM.INITIAL)

    const validator = new Validator({ prefix: 'Register', errorHandler: setErrors })

    const validatePersonalData = () => {
        const { name, documentType, documentNumber, birthdate, gender } = form
        return validator.every([
            ['Name', () => validator.set({ name }).required().length(3, 50)],
            ['DocumentType', () => validator.set({ documentType }).required()],
            ['DocumentNumber', () => validator.set({ documentNumber }).required().length(5, 25)],
            ['Birthdate', () => validator.set({ birthdate }).required().isDate()],
            ['Gender', () => validator.set({ gender }).required()]
        ])
    }

    const validateContactData = () => {
        const { country, city, address, phoneNumber, email } = form
        return validator.every([
            ['Country', () => validator.set({ country }).required().length(3, 50)],
            ['City', () => validator.set({ city }).required().length(3, 50)],
            ['Address', () => validator.set({ address }).required().length(6, 150)],
            ['PhoneNumber', () => validator.set({ phoneNumber }).required().length(6, 20)],
            ['Email', () => validator.set({ email }).required().email()],
        ])
    }

    const validateAccountData = () => {
        const { username, password, repeatPassword } = form
        return validator.every([
            ['Username', () => validator.set({ username }).required().length(3, 100).username()],
            ['Password', () => validator.set({ password }).required().isStrongPassword()],
            ['RepeatPassword', () => validator.set({ repeatPassword }).required().isStrongPassword().isSamePassword(password)],
        ])
    }

    const validateImage = () => {
        const { image } = form
        return validator.every([
            ['Image', () => validator.set({ image }).required()]
        ])
    }

    const validate = () => {
        return validatePersonalData() && validateContactData() && validateAccountData() && validateImage()
    }

    const handler = async (event) => {
        event.preventDefault()

        if (!validate()) return false

        const success = await signUp(form)
        if (success) {
            Notify.notice('Se ha registrado correctamente', 'success')
            setAuthenticationMode('login')
        }
    }

    const handleLogin = () => {
        setStep(1)
        resetForm()
        setAuthenticationMode('login')
    }

    const nextStep = () => {
        if ({ 1: validatePersonalData, 2: validateContactData, 3: validateAccountData, 4: validateImage }[step]()) setStep(prev => prev + 1)
    }

    const prevStep = () => {
        setStep(prev => prev != 1 ? prev - 1 : 1)
    }

    useEffect(() => {
        return () => {
            if (form.image instanceof Object) {
                URL.revokeObjectURL(form.image)
            }
        }
    }, [form.image])

    const handleImageChange = (event) => {
        if (Array.from(event.target.files)[0]) {
            const file = Array.from(event.target.files)[0]
            setForm(prev => ({
                ...prev,
                image: file
            }))
        }
    }

    const handleImageInputClick = () => {
        if (imageInputRef.current) {
            imageInputRef.current.click()
        }
    }

    const handleImageInputClear = () => {
        if (imageInputRef.current) {
            imageInputRef.current.value = null
        }
        if (form.image instanceof Object) {
            URL.revokeObjectURL(form.image)
        }
        setForm(prev => ({
            ...prev,
            image: ''
        }))
    }

    return (
        <div className={`lx-m-authentication-register ${authenticationMode === 'register' ? '--active' : '--inactive'}`}>
            <div className='lx-m-authentication-register-container'>
                <div className='lx-m-authentication-register-content'>
                    <div className='lx-m-authentication-register-form-greatings'>
                        <span className='lx-m-authentication-register-form-logo'>
                            <Brand size='xl' className='lx-m-authentication-register-form-logo-svg' />
                        </span>
                        <br />
                        <div className='lx-m-authentication-register-progress'>
                            <div className='--bar' style={{ '--lx-m-authentication-register-progress': { 1: '10%', 2: '40%', 3: '60%', 4: '80%', 5: '100%' }[step] }}></div>
                        </div>
                    </div>
                    <form className='lx-m-authentication-register-form'>
                        <div className='lx-m-authentication-register-form-content'>
                            <div className={`lx-m-authentication-register-form-content-section ${step === 1 && '--visible'}`}>
                                <p className='lx-m-authentication-register-form-content-section-text'>Digita tus datos personales para que podamos identificarte en el sistema</p>
                                <br />
                                <InputGroup>
                                    <InputGroup columns='1'>
                                        <Input
                                            required
                                            id='RegisterName'
                                            name='name'
                                            label='Nombre completo'
                                            type='text'
                                            autoComplete='off'
                                            minLength={1}
                                            maxLength={100}
                                            value={form.name}
                                            onChange={handleChange}
                                            error={errors.name}
                                        />
                                    </InputGroup>
                                    <InputGroup columns='2' mode='min-max'>
                                        <Select
                                            required
                                            id='RegisterDocumentType'
                                            name='documentType'
                                            label='Documento'
                                            autoComplete='off'
                                            options={REGISTER.OPTIONS.DOCUMENT}
                                            value={form.documentType}
                                            onChange={handleChange}
                                            error={errors.documentType}
                                        />
                                        <Input
                                            required
                                            id='RegisterDocumentNumber'
                                            name='documentNumber'
                                            label='Número'
                                            type='text'
                                            autoComplete='off'
                                            minLength={5}
                                            maxLength={100}
                                            value={form.documentNumber}
                                            onChange={handleChange}
                                            error={errors.documentNumber}
                                        />
                                    </InputGroup>
                                    <InputGroup columns='2'>
                                        <Input
                                            required
                                            id='RegisterBirthdate'
                                            name='birthdate'
                                            label='Fecha de Nacimiento'
                                            type='date'
                                            autoComplete='off'
                                            value={form.birthdate}
                                            onChange={handleChange}
                                            error={errors.birthdate}
                                        />
                                        <Select
                                            required
                                            id='RegisterGender'
                                            name='gender'
                                            label='Género'
                                            autoComplete='off'
                                            options={REGISTER.OPTIONS.GENDER}
                                            value={form.gender}
                                            onChange={handleChange}
                                            error={errors.gender}
                                        />
                                    </InputGroup>
                                </InputGroup>
                            </div>
                            <div className={`lx-m-authentication-register-form-content-section ${step === 2 && '--visible'}`}>
                                <p className='lx-m-authentication-register-form-content-section-text'>Comparte tus datos de residencia y contacto</p>
                                <br />
                                <InputGroup>
                                    <InputGroup columns='2'>
                                        <Input
                                            required
                                            id='RegisterCountry'
                                            name='country'
                                            label='País'
                                            type='text'
                                            autoComplete='off'
                                            minLength={1}
                                            maxLength={100}
                                            value={form.country}
                                            onChange={handleChange}
                                            error={errors.country}
                                        />
                                        <Input
                                            required
                                            id='RegisterCity'
                                            name='city'
                                            label='Ciudad'
                                            type='text'
                                            autoComplete='off'
                                            minLength={1}
                                            maxLength={100}
                                            value={form.city}
                                            onChange={handleChange}
                                            error={errors.city}
                                        />
                                    </InputGroup>
                                    <Input
                                        required
                                        id='RegisterAddress'
                                        name='address'
                                        label='Dirección'
                                        type='text'
                                        autoComplete='off'
                                        minLength={1}
                                        maxLength={500}
                                        value={form.address}
                                        onChange={handleChange}
                                        error={errors.address}
                                    />
                                    <InputGroup columns='2'>
                                        <Input
                                            required
                                            id='RegisterPhoneNumber'
                                            name='phoneNumber'
                                            label='Teléfono'
                                            type='text'
                                            autoComplete='off'
                                            minLength={5}
                                            maxLength={100}
                                            value={form.phoneNumber}
                                            onChange={handleChange}
                                            error={errors.phoneNumber}
                                        />
                                        <Input
                                            required
                                            id='RegisterEmail'
                                            name='email'
                                            label='Correo'
                                            type='mail'
                                            autoComplete='off'
                                            value={form.email}
                                            onChange={handleChange}
                                            error={errors.email}
                                        />
                                    </InputGroup>
                                </InputGroup>
                            </div>
                            <div className={`lx-m-authentication-register-form-content-section ${step === 3 && '--visible'}`}>
                                <p className='lx-m-authentication-register-form-content-section-text'>Establece unas credenciales de acceso seguras</p>
                                <br />
                                <InputGroup>
                                    <Input
                                        required
                                        id='RegisterUsername'
                                        name='username'
                                        label='Username'
                                        type='text'
                                        autoComplete='off'
                                        minLength={3}
                                        maxLength={100}
                                        value={form.username}
                                        onChange={handleChange}
                                        error={errors.username}
                                    />
                                    <InputGroup columns='2'>
                                        <Password
                                            required
                                            id='RegisterPassword'
                                            name='password'
                                            label='Contraseña'
                                            value={form.password}
                                            onChange={handleChange}
                                            error={errors.password}
                                        />
                                        <Password
                                            required
                                            id='RegisterRepeatPassword'
                                            name='repeatPassword'
                                            label='Repetir Contraseña'
                                            value={form.repeatPassword}
                                            onChange={handleChange}
                                            error={errors.repeatPassword}
                                        />
                                    </InputGroup>
                                </InputGroup>
                            </div>
                            <div className={`lx-m-authentication-register-form-content-section ${step === 4 && '--visible'}`}>
                                <p className='lx-m-authentication-register-form-content-section-text'>Selecciona una imagen de perfil</p>
                                <br />

                                <div className='lx-m-authentication-register-form-image-container'>
                                    <div className='lx-m-authentication-register-form-image' onClick={handleImageInputClick}>
                                        {form.image ? <img className='--image' src={form.image instanceof Object ? URL.createObjectURL(form.image) : form.image} /> : <Logo size='s' color='ghost' />}
                                    </div>
                                    <div className='lx-m-authentication-register-form-image-actions'>
                                        <Button size='xs' radius='full' color='auto' variant='bordered' onClick={handleImageInputClick}>
                                            <Icon name={form.image ? 'reset_image' : 'image_arrow_up'} />
                                            {form.image ? 'Cambiar' : 'Agregar imagen'}
                                        </Button>
                                        {form.image
                                            && <Button size='xs' radius='full' color='danger' onClick={handleImageInputClear}>
                                                <Icon name='hide_image' />
                                                Eliminar
                                            </Button>
                                        }
                                    </div>

                                    <div className='lx-forms-input-group-hidden'>
                                        <input onChange={handleImageChange}
                                            ref={imageInputRef}
                                            className='lx-forms-input'
                                            id='RegisterImage'
                                            name='image'
                                            type='file'
                                            accept="image/png, image/jpeg, image/webp, .png, .jpg, .webp"
                                            autoComplete='off'
                                        />
                                        <label htmlFor='RegisterImage' className='lx-forms-label'>Imagen</label>
                                    </div>
                                </div>

                            </div>

                            <div className={`lx-m-authentication-register-form-content-section ${step === 5 && '--visible'}`}>
                                <p className='lx-m-authentication-register-form-content-section-message'>
                                    ¡Listo! Ya tenemos tus datos validados para crear la cuenta y terminar con el proceso. Haz un click el botón de "Registrarse" a continuación, e inicia sesión con tus credenciales.
                                </p>
                            </div>
                        </div>
                        <div className='lx-m-authentication-register-form-actions'>
                            {step > 1 &&
                                <Button color='auto' variant='ghost' onClick={prevStep}>
                                    <Icon name='chevron_left' />
                                    Volver
                                </Button>
                            }
                            {step <= 4 &&
                                <Button onClick={nextStep}>
                                    Siguiente
                                    <Icon name='chevron_right' />
                                </Button>
                            }
                            {step === 5 &&
                                <Button onClick={handler}>
                                    <Icon name='input' />
                                    Registrarse
                                </Button>
                            }
                        </div>
                        <div className='lx-m-authentication-register-form-note'>
                            Al registrarse, acepta nuestros <strong>Términos de Servicio</strong>, y nuestras políticas, <strong>Política de Privacidad</strong> y <strong>Política de Tratamientos de Datos Personales</strong>
                        </div>
                        <div className='lx-m-authentication-register-form-actions'>
                            <Button size='xs' color='accent' variant='plain' onClick={handleLogin}>
                                <Icon name='lock' />
                                Iniciar Sesión
                            </Button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}

export default RegisterForm