import { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext({
  theme: 'light',
  userPreference: 'system',
  setThemePreference: () => { },
})

export const ThemeProvider = ({ children }) => {

  const getSystemPreference = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const getInitialUserPreference = () => localStorage.getItem('theme-preference') || 'system'

  const [userPreference, setUserPreference] = useState(getInitialUserPreference)
  const [theme, setTheme] = useState(() => getInitialUserPreference() === 'system' ? getSystemPreference() : getInitialUserPreference())

  const applyTheme = (themeToApply) => {
    document.documentElement.setAttribute('data-theme', themeToApply)
  }

  useEffect(() => {
    const effectiveTheme = userPreference === 'system'
      ? getSystemPreference()
      : userPreference

    setTheme(effectiveTheme)
    applyTheme(effectiveTheme)
    localStorage.setItem('theme-preference', userPreference)
  }, [userPreference])

  useEffect(() => {
    if (userPreference !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light'
      setTheme(systemTheme)
      applyTheme(systemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [userPreference])

  const setThemePreference = (preference) => {
    setUserPreference(preference)
  }

  return (
    <ThemeContext.Provider value={{ theme, userPreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider