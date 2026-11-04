import './SatatusTag.css'

const SatatusTag = ({ status, message }) => {
    return (<div className={`lx-c-status-tag ${status ? 'active' : 'inactive'}`}>
        {message ? message : status ? 'Activo' : 'Inactivo'}
    </div>)
}

export default SatatusTag