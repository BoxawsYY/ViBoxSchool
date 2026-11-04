import './ImageUploader.css'
import { useRef, useEffect } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import Logo from '../Logo/Logo'

const ImageUploader = ({ value, setForm, name }) => {
    const imageInputRef = useRef(null)

    useEffect(() => {
        return () => {
            if (value instanceof Object) {
                URL.revokeObjectURL(value)
            }
        }
    }, [value])

    const handleImageChange = (event) => {
        const file = Array.from(event.target.files)[0]
        if (file) {
            setForm(prev => ({
                ...prev,
                [name]: file
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
        if (value instanceof Object) {
            URL.revokeObjectURL(value)
        }
        setForm(prev => ({
            ...prev,
            [name]: ''
        }))
    }

    return (
        <div className='lx-c-image-uploader-container'>
            <div className='lx-c-image-uploader' onClick={handleImageInputClick}>
                {value
                    ? <img className='--image' src={value instanceof Object ? URL.createObjectURL(value) : value} />
                    : <Logo size='s' color='ghost' />}
            </div>

            <div className='lx-c-image-uploader-actions'>
                <Button size='xs' radius='full' color='auto' variant='bordered' onClick={handleImageInputClick}>
                    <Icon name={value ? 'reset_image' : 'image_arrow_up'} />
                    {value ? 'Cambiar' : 'Agregar imagen'}
                </Button>
                {value &&
                    <Button size='xs' radius='full' color='danger' onClick={handleImageInputClear}>
                        <Icon name='hide_image' />
                        Eliminar
                    </Button>
                }
            </div>

            <div className='lx-forms-input-group-hidden'>
                <input
                    onChange={handleImageChange}
                    ref={imageInputRef}
                    className='lx-forms-input'
                    id={`${name}-input`}
                    name={name}
                    type='file'
                    accept="image/png, image/jpeg, image/webp, .png, .jpg, .webp"
                    autoComplete='off'
                />
                <label htmlFor={`${name}-input`} className='lx-forms-label'>Imagen</label>
            </div>
        </div>
    )
}

export default ImageUploader
