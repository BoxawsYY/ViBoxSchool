import './Input.css'

const Input = ({ id, value, name, label, error, ...props }) => {
    return (
        <div className='lx-forms-input-field'>
            <div className={`lx-forms-input-group ${error ? '--error' : ''}`}>
                <input 
                    id={id} 
                    className='lx-forms-input' 
                    name={name} 
                    value={value ?? ''} 
                    aria-invalid={!!error} 
                    {...props} 
                />
                <label htmlFor={id} className='lx-forms-label'>{label}</label>
            </div>
            {error && <span className='lx-forms-error'>{error}</span>}
        </div>
    )
}

export default Input