import PropTypes from 'prop-types'
import { useAuth } from '../../../../core/contexts/AuthContext'
import PlatformLogo from '../../../../core/components/PlatformLogo/PlatformLogo'
import ThemeToggle from '../../../../core/components/ThemeToggle/ThemeToggle'
import './PanelHeader.css'

const ROLE_LABELS = {
    Admin: 'Administrador',
    Rector: 'Rector',
    Secretary: 'Secretaría',
    Guardian: 'Padre de familia'
}

const getSchoolName = (user) => (
    user?.school?.name ||
    user?.schoolName ||
    user?.tenant?.name ||
    'Mi colegio'
)

const PanelHeader = ({ role }) => {
    const { user } = useAuth()
    const userName = user?.name || user?.username || 'Usuario'
    const initials = userName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')

    return (
        <header className='lx-c-panel-header'>
            <div className='lx-c-panel-header-brand'>
                <PlatformLogo className='lx-c-panel-header-logo' />
                <span className='lx-c-panel-header-divider' aria-hidden='true' />
                <span className='lx-c-panel-header-context'>
                    {role === 'Admin'
                        ? 'Plataforma · Administración global'
                        : getSchoolName(user)}
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
                <div className='lx-c-panel-header-user'>
                    {user?.image
                        ? <img src={user.image} alt='' />
                        : <span className='lx-c-panel-header-avatar' aria-hidden='true'>{initials || '?'}</span>}
                    <span className='lx-c-panel-header-name'>{userName}</span>
                </div>
                <ThemeToggle />
            </div>
        </header>
    )
}

PanelHeader.propTypes = {
    role: PropTypes.string.isRequired
}

export default PanelHeader
