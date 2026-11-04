import './Icon.css'

const Icon = ({ name = '', size = 'm', type = 'rounded', className, ...props }) => {
    return (
        <span className={`lx-c-icon material-symbols-${type} --${size} ${className || ''}`} {...props} translate='no'>
            {name}
        </span>
    );
}

export default Icon