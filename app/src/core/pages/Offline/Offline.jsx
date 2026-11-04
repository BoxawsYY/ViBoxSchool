import './Offline.css'

const Offline = () => {
    return (<>
        <div className='lx-p-offline'>
            <div className='lx-p-offline-content'>
                <span className='material-symbols-rounded lx-p-offline-icon' translate='no' aria-hidden='true'>
                    wifi_off
                </span>
                <h1>Sin conexión</h1>
                <br />
                <p>No se ha detectado una <b>conexión</b> a <b>internet</b></p>
                <p>para acceder a este módulo</p>
            </div>
        </div>
    </>)
}

export default Offline