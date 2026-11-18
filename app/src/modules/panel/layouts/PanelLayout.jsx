import './PanelLayout.css'
import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../../core/contexts/AuthContext'
import ConnectionWrapper from '../../../core/components/ConnectionWrapper/ConnectionWrapper'
import Notify from '../../../core/lib/notify.mjs'
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
    const [sidebarExpanded, setSidebarExpanded] = useState(getInitialSidebarState)
    const popoverRef = useRef(null)
    const [userCardOpen, setUserCardOpen] = useState(false)
    const role = forcedRole || session?.user?.roles?.find((userRole) => ROLE_MENUS[userRole]) || 'Admin'
    const activeMenu = role === 'Admin' ? menu : ROLE_MENUS[role] || menu
    const visibleItems = activeMenu.filter((item) => hasAuthorities(session, item.authorities))

    useEffect(() => {
        window.localStorage.setItem('sidebar', JSON.stringify(sidebarExpanded))
    }, [sidebarExpanded])

    useEffect(() => {
        if (!userCardOpen) return undefined

        const handlePointerDown = (event) => {
            if (popoverRef.current?.contains(event.target)) return
            if (event.target.closest?.('.lx-c-panel-header-user')) return
            setUserCardOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [userCardOpen])

    if (!session) return null

    return (
        <div className={`lx-l-panel ${sidebarExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <PanelHeader role={role} onOpenProfile={() => setUserCardOpen((open) => !open)} />
            <aside className='lx-l-panel-sidebar'>
                <div className='lx-l-panel-sidebar-menu'>
                    <nav className='lx-l-panel-nav' aria-label='Navegación principal'>
                        {visibleItems.map((item) => (
                            <NavLink
                                key={item.to}
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
                        ))}
                    </nav>
                    <div className='lx-l-panel-sidebar-footer'>
                        <button
                            className='lx-l-panel-sidebar-action lx-l-panel-manual-action'
                            type='button'
                            onClick={() => Notify.notice('El manual de usuario en PDF estará disponible próximamente', 'info')}
                            title='Manual de usuario en PDF'
                            aria-label='Manual de usuario en PDF'
                        >
                            <span className='material-symbols-rounded' aria-hidden='true'>help</span>
                            <span className='lx-l-panel-sidebar-action-label'>Manual de usuario (PDF)</span>
                        </button>
                        <button
                            className='lx-l-panel-sidebar-action lx-l-panel-signout-action'
                            type='button'
                            onClick={signOut}
                            aria-label='Cerrar sesión'
                            title='Cerrar sesión'
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
                <div ref={popoverRef} className='lx-l-panel-session-popover'>
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
