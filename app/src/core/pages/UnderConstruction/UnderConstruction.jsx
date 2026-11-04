import './UnderConstruction.css'

const UnderConstruction = () => {
    return (<>
        <div className='lx-p-under-construction'>
            <div className='content'>
                <span className='material-symbols-rounded lx-p-construction-icon' translate='no' aria-hidden='true'>
                    construction
                </span>
                <h1>{window.location.pathname}</h1>
                <br />
                <p>Esta página se encuentra en desarrollo.</p>
            </div>
        </div>
    </>)
}

export default UnderConstruction