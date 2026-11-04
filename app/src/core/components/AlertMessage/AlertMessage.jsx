import './AlertMessage.css'

const AlertMessage = ({ type = 'info', message = '', children, icon, size='max' }) =>  {
    return (
        <div className={`lx-c-alert-message ${type} ${size}`}>
            <div className='lx-c-alert-message-icon'>
                <span className='material-symbols-rounded' translate='no'>{icon ? icon :{
                    info: 'info',
                    warning: 'warning',
                    error: 'error',
                    success: 'check_circle'
                }[type] || 'info'}</span>
            </div>
            <div className='lx-c-alert-message-message'>{message || children}</div>
        </div>
    )
}

export default AlertMessage