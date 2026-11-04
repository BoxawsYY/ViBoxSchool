import './Divider.css'

const Divider = ({ text }) => {
    return (
        <div className='lx-c-divider'>
            <div className='--divider-line' />
            {text && <span className='--divider-text'>{text}</span>}
            <div className='--divider-line' />
        </div>
    )
}

export default Divider