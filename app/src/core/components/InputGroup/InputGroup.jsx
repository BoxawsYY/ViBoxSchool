import './InputGroup.css'

const InputGroup = ({ children, columns = 1, mode = '' }) => {
    return (
        <div className={`lx-forms-input-group${{1: '-single', 2: '-double', 3: '-triple'}[columns] || ''} ${mode ? `--double-${mode}` : ''}`}>
            {children}
        </div>
    )
}

export default InputGroup