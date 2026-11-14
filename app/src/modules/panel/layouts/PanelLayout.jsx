import './PanelLayout.css'
import { useEffect, useState, Fragment } from 'react'
import PropTypes from 'prop-types'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../../core/contexts/AuthContext'
import { useTheme } from '../../../core/hooks/useTheme'
import ConnectionWrapper from '../../../core/components/ConnectionWrapper/ConnectionWrapper'
import PanelHeader from '../components/PanelHeader/PanelHeader'
import UserSessionCard from '../components/User/UserSessionCard'
import { ROLE_MENUS } from '../config/panel.config'

const getInitialSidebarState = () => {
    try {
        const stored = window.localStorage.getItem('sidebar')
        return stored === null ? true : JSON.parse(stored)
    } catch {
        return true
    }
}

function PanelLayout({ menu, role: forcedRole }) {
    const { session, signOut, hasAuthorities } = useAuth()
    const { isDarkTheme, setThemePreference } = useTheme()
    const [sidebarExpanded, setSidebarExpanded] = useState(getInitialSidebarState)
    const [userCardOpen, setUserCardOpen] = useState(false)
    const role = forcedRole || session?.user?.roles?.find((userRole) => ROLE_MENUS[userRole]) || 'Admin'
    const activeMenu = role === 'Admin' ? menu : ROLE_MENUS[role] || menu
    const visibleItems = activeMenu.filter((item) => hasAuthorities(session, item.authorities))

    useEffect(() => {
        window.localStorage.setItem('sidebar', JSON.stringify(sidebarExpanded))
    }, [sidebarExpanded])

    if (!session) return null

    const user = session.user || {}
    const userName = user.name || user.username || 'Usuario'
    const userEmail = user.email || 'Sin correo'

    return (
        <div className={`lx-l-panel ${sidebarExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <PanelHeader role={role} />
            <aside className='lx-l-panel-sidebar'>
                <div className='lx-l-panel-sidebar-menu'>
                    <div className='lx-l-panel-sidebar-top'>
                        <button
                            className='lx-l-panel-sidebar-session'
                            type='button'
                            onClick={() => setUserCardOpen(true)}
                            title={`${userName} · ${userEmail}`}
                            aria-label={`Ver perfil de ${userName}`}
                        >
                            <span className='lx-l-panel-sidebar-session-avatar'>
                                {user.image
                                    ? <img src={user.image} alt='' />
                                    : <span className='lx-l-panel-sidebar-session-char'>{userName[0]?.toUpperCase() || '?'}</span>}
                                <span className='lx-l-panel-sidebar-session-status' aria-label='Estado activo' />
                            </span>
                            <span className='lx-l-panel-sidebar-session-details'>
                                <strong>{userName}</strong>
                                <span>@{user.username || 'visitante'}</span>
                            </span>
                        </button>
                    </div>
                    <nav className='lx-l-panel-nav' aria-label='Navegación principal'>
                        {visibleItems.map((item, index) => (
                            <Fragment key={item.to}>
                                {item.section && item.section !== visibleItems[index - 1]?.section && (
                                    <span className='lx-l-panel-nav-section'>{item.section}</span>
                                )}
                                <NavLink
                                    to={item.to}
                                    end={Boolean(item.isBase)}
                                    className={({ isActive }) => (
                                        isActive
                                            ? 'lx-l-panel-nav-link is-active'
                                            : 'lx-l-panel-nav-link'
                                    )}
                                    title={sidebarExpanded ? undefined : item.label}
                                >
                                    <span className='material-symbols-rounded' aria-hidden='true'>{item.icon}</span>
                                    <span className='lx-l-panel-nav-label'>{item.label}</span>
                                </NavLink>
                            </Fragment>
                        ))}
                    </nav>
                    <div className='lx-l-panel-sidebar-footer'>
                        <button
                            className='lx-l-panel-sidebar-action lx-l-panel-theme-action'
                            type='button'
                            onClick={() => setThemePreference(isDarkTheme ? 'light' : 'dark')}
                            aria-pressed={isDarkTheme}
                            title={sidebarExpanded ? undefined : `Modo ${isDarkTheme ? 'claro' : 'oscuro'}`}
                        >
                            <span className='material-symbols-rounded' aria-hidden='true'>
                                {isDarkTheme ? 'light_mode' : 'dark_mode'}
                            </span>
                            <span className='lx-l-panel-sidebar-action-label'>Modo {isDarkTheme ? 'claro' : 'oscuro'}</span>
                        </button>
                        <button
                            className='lx-l-panel-sidebar-action lx-l-panel-signout'
                            type='button'
                            onClick={signOut}
                            aria-label='Cerrar sesión'
                            title={sidebarExpanded ? undefined : 'Cerrar sesión'}
                        >
                            <span className='material-symbols-rounded' aria-hidden='true'>logout</span>
                            <span className='lx-l-panel-sidebar-action-label'>Cerrar sesión</span>
                        </button>
                    </div>
                </div>
                        <button
                            className='lx-l-panel-sidebar-toggle'
                            type='button'
                            onClick={() => setSidebarExpanded((expanded) => !expanded)}
                            aria-label={sidebarExpanded ? 'Contraer barra lateral' : 'Expandir barra lateral'}
                            aria-expanded={sidebarExpanded}
                            title={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
                        >
                            <span className='material-symbols-rounded' aria-hidden='true'>
                                {sidebarExpanded ? 'first_page' : 'last_page'}
                            </span>
                        </button>
            </aside>
            <main className='lx-l-panel-main'>
                <ConnectionWrapper>
                    <div className='lx-l-panel-content'>
                        <Outlet />
                    </div>
                </ConnectionWrapper>
            </main>
            {userCardOpen && (
                <div className='lx-l-panel-session-popover'>
                    <UserSessionCard onClose={() => setUserCardOpen(false)} />
                </div>
            )}
        </div>
    )
}

PanelLayout.propTypes = {
    menu: PropTypes.array.isRequired,
    role: PropTypes.string
}

export default PanelLayout
