import PropTypes from 'prop-types'
import { useAuth } from '../../../../core/contexts/AuthContext'
import PlatformLogo from '../../../../core/components/PlatformLogo/PlatformLogo'
import ThemeToggle from '../../../../core/components/ThemeToggle/ThemeToggle'
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

const PanelHeader = ({ role, onOpenProfile }) => {
    const { user } = useAuth()
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
                <button
                    className='lx-c-panel-header-notifications'
                    type='button'
                    aria-label='Notificaciones'
                    title='Notificaciones'
                >
                    <span className='material-symbols-rounded' aria-hidden='true'>notifications</span>
                </button>
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
