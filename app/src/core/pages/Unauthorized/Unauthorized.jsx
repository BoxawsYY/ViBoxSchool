import './Unauthorized.css'

const Unauthorized = () => {
    return (<>
        <div className='lx-p-unauthorized'>
            <div className='lx-p-unauthorized-content'>
                <span className='material-symbols-rounded lx-p-unauthorized-icon' translate='no' aria-hidden='true'>
                    warning
                </span>
                <h1>No Autorizado</h1>
                <br />
                <p>No cuenta con los <b>roles</b> o <b>permisos</b> necesarios</p>
                <p>para acceder a este módulo</p>
            </div>
        </div>
    </>)
}

export default Unauthorized