import './TableHeader.css'

const TableHeader = ({ icon, leftIcon, rightIcon, title }) => {
    return (<div className='lx-c-table-header'>
        {(leftIcon || icon) && <span className='material-symbols-rounded' translate='no'>{leftIcon || icon}</span>}
        <span>{title}</span>
        {rightIcon && <span className='material-symbols-rounded' translate='no'>{rightIcon}</span>}
    </div>)
}

export default TableHeader