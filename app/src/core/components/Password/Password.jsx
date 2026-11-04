import Icon from '../Icon/Icon'
import './Password.css'
import { useState } from 'react'

const Password = ({ id, name, label, error, value, onChange, ...props }) => {
    const [show, setShow] = useState(false)
    const inputId = id || name

    return (
        <div className='lx-forms-input-field'>
            <div className={`lx-forms-input-group ${error ? '--error' : ''}`}>
                <input
                    id={inputId}
                    className='lx-forms-input'
                    name={name}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                <label htmlFor={inputId} className='lx-forms-label'>{label}</label>

                <button
                    type='button'
                    className='lx-forms-password-toggle'
                    onClick={() => setShow(showState => !showState)}
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    <Icon name={show ? 'visibility_off' : 'visibility'} />
                </button>
            </div>
            {error && <span className='lx-forms-error'>{error}</span>}
        </div>
    )
}

export default Password