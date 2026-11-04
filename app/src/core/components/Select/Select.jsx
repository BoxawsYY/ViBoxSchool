import './Select.css'

const Select = ({ id, name, label, error, options = [], ...props }) => {
    return (
        <div className='lx-forms-input-field'>
            <div className={`lx-forms-input-group ${error ? '--error' : ''}`}>
               <select id={id} className='lx-forms-input' name={name} aria-invalid={!!error} {...props}>
                    <option value={''}></option>
                    {options.map((option, index) => <option key={`select-option-${id}-${index}-${option.value || option}`} value={option.value || option}>{option.key || option}</option>)}
                </select>
                <label htmlFor={id} className='lx-forms-label'>{label}</label>
            </div>
            {error && <span className='lx-forms-error'>{error}</span>}
        </div>
    )
}

export default Select