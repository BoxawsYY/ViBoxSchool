import './ThemeToggle.css'
import { useTheme } from '../../hooks/useTheme'

const ThemeToggle = () => {
    const { isDarkTheme, setThemePreference } = useTheme()
    const nextTheme = isDarkTheme ? 'light' : 'dark'

    return (
        <button
            className='lx-c-theme-toggle'
            type='button'
            onClick={() => setThemePreference(nextTheme)}
            aria-label={`Cambiar a modo ${isDarkTheme ? 'claro' : 'oscuro'}`}
            title={`Cambiar a modo ${isDarkTheme ? 'claro' : 'oscuro'}`}
            aria-pressed={isDarkTheme}
        >
            <span className='material-symbols-rounded' translate='no' aria-hidden='true'>
                {isDarkTheme ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    )
}

export default ThemeToggle
