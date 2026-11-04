import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

export const useTheme = () => {
    const context = useContext(ThemeContext)
  
    const isDarkTheme = context.theme === 'dark'
    const isLightTheme = context.theme === 'light'
    const isSystemTheme = context.userPreference === 'system'
  
    return {
      ...context,
      isDarkTheme,
      isLightTheme,
      isSystemTheme
    }
}