import './NotFound.css'
import { useTheme } from '../../hooks/useTheme.jsx'

const NotFound = () => {

    const { isDarkTheme, setThemePreference } = useTheme()

    return (<>
        <div className='lx-p-not-found'>
            <h1 className='lx-p-not-found-title'>404</h1>
            <h2 className='lx-p-not-found-sub-title'>Página no encontrada</h2>
            <p className='lx-p-not-found-text'>Lo sentimos, la página que estás buscando no existe.</p>
            <a className='lx-p-not-found-anchor' href="/">Ir al Inicio</a>
            <button className='lx-p-not-found-theme' onClick={() => {
                setThemePreference(isDarkTheme ? 'light' : 'dark')
            }}><span className='material-symbols-rounded' translate='no' aria-hidden='true'>{isDarkTheme ? 'light' : 'dark'}_mode</span></button>
        </div>
    </>)
}

export default NotFound