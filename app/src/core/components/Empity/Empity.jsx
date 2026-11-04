import './Empity.css'

const Empity = ({ icon='data_alert', message = 'No hay datos para mostrar' }) => {
    return (
        <div className='lx-c-empty'>
            <span className='material-symbols-rounded'>{icon}</span>
            <p>{message}</p>
        </div>
    )
}

export default Empity