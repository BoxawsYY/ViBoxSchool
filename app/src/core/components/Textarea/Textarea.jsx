import './Textarea.css'

const Textarea = ({ id, value, name, label, error, ...props }) => {
    return (
        <div className='lx-forms-input-field'>
            <div className={`lx-forms-input-group ${error ? '--error' : ''}`}>
                <textarea 
                    id={id} 
                    className='lx-forms-textarea' 
                    name={name} 
                    value={value ?? ''}
                    aria-invalid={!!error} 
                    {...props} 
                />
                <label htmlFor={id} className='lx-forms-label-textarea'>{label}</label>
            </div>
            {error && <span className='lx-forms-error'>{error}</span>}
        </div>
    )
}

export default Textarea