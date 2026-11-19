import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../core/contexts/AuthContext'
import PlatformLogo from '../../../../core/components/PlatformLogo/PlatformLogo'
import ThemeToggle from '../../../../core/components/ThemeToggle/ThemeToggle'
import NotificationsRequester from '../../services/NotificationsRequester.mjs'
import './PanelHeader.css'

const ROLE_LABELS = {
    Admin: 'Administrador',
    Rector: 'Rector',
    Secretary: 'Secretaría',
    Guardian: 'Padre de Familia'
}

const getSchoolName = (user) => (
    user?.school?.name ||
    user?.schoolName ||
    user?.tenant?.name ||
    'Mi colegio'
)

const getAcademicYear = (user) => (
    user?.school?.academicYear ||
    user?.school?.year ||
    user?.academicYear ||
    'Año lectivo 2027'
)

const NOTIFICATION_PATHS = {
    Rector: '/panel/rector/notifications',
    Secretary: '/panel/secretary/notifications',
    Guardian: '/panel/guardian/notifications'
}

const PanelHeader = ({ role, onOpenProfile }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const userName = user?.name || user?.username || 'Usuario'
    const initials = userName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')

    const isAdmin = role === 'Admin'
    const schoolName = getSchoolName(user)
    const academicYear = getAcademicYear(user)
    const notificationPath = NOTIFICATION_PATHS[role]
    const currentPath = location.pathname.replace(/\/+$/, '')
    const isNotificationsPage = Boolean(notificationPath && currentPath === notificationPath)

    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const data = await NotificationsRequester.unreadCount()
                if (!cancelled) setUnreadCount(data?.count ?? 0)
            } catch {
                if (!cancelled) setUnreadCount(0)
            }
        }

        load()
        window.addEventListener('notifications:changed', load)

        return () => {
            cancelled = true
            window.removeEventListener('notifications:changed', load)
        }
    }, [location.pathname])

    const hasUnread = unreadCount > 0

    return (
        <header className='lx-c-panel-header'>
            <div className='lx-c-panel-header-brand'>
                <PlatformLogo className='lx-c-panel-header-logo' />
                <span className='lx-c-panel-header-divider' aria-hidden='true' />
                <span className={`lx-c-panel-header-context${isAdmin ? ' is-admin' : ''}`}>
                    {!isAdmin && <span className='lx-c-panel-header-context-dot' aria-hidden='true' />}
                    <span className='lx-c-panel-header-context-text'>
                        {isAdmin ? 'Plataforma · Administración global' : `${schoolName} · ${academicYear}`}
                    </span>
                    {!isAdmin && <span className='material-symbols-rounded' aria-hidden='true'>expand_more</span>}
                </span>
            </div>
            <div className='lx-c-panel-header-actions'>
                {isNotificationsPage ? (
                    <span
                        className={`lx-c-panel-header-notifications is-active${hasUnread ? ' has-unread' : ''}`}
                        aria-current='page'
                        aria-label='Ya estás en Notificaciones'
                        title='Ya estás en Notificaciones'
                    >
                        <span className='material-symbols-rounded' aria-hidden='true'>notifications</span>
                    </span>
                ) : notificationPath ? (
                    <button
                        className={`lx-c-panel-header-notifications${hasUnread ? ' has-unread' : ''}`}
                        type='button'
                        onClick={() => navigate(notificationPath)}
                        aria-label='Ir a Notificaciones'
                        title='Ir a Notificaciones'
                    >
                        <span className='material-symbols-rounded' aria-hidden='true'>notifications</span>
                    </button>
                ) : (
                    <button
                        className='lx-c-panel-header-notifications is-disabled'
                        type='button'
                        disabled
                        aria-label='Notificaciones no disponibles'
                        title='Notificaciones no disponibles'
                    >
                        <span className='material-symbols-rounded' aria-hidden='true'>notifications</span>
                    </button>
                )}
                <span className='lx-c-panel-header-role'>{ROLE_LABELS[role] || role}</span>
                <button
                    className='lx-c-panel-header-user'
                    type='button'
                    onClick={onOpenProfile}
                    aria-label={`Ver perfil de ${userName}`}
                    title={userName}
                >
                    {user?.image
                        ? <img src={user.image} alt='' />
                        : <span className='lx-c-panel-header-avatar' aria-hidden='true'>{initials || '?'}</span>}
                    <span className='lx-c-panel-header-name'>{userName}</span>
                </button>
                <ThemeToggle />
            </div>
        </header>
    )
}

PanelHeader.propTypes = {
    role: PropTypes.string.isRequired,
    onOpenProfile: PropTypes.func.isRequired
}

export default PanelHeader
