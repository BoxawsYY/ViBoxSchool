import './NotificationsPage.css'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../core/contexts/AuthContext'
import { getNotificationProfile } from './notifications.config.mjs'

const getSessionRoles = (session) => {
    const roles = Array.isArray(session?.user?.roles) ? session.user.roles : []
    const fallbackRole = session?.user?.role ? [session.user.role] : []

    return [...new Set([...roles, ...fallbackRole])]
}

const NotificationsPage = () => {
    const { session } = useAuth()
    const roles = useMemo(() => getSessionRoles(session), [session])
    const { role, profile } = useMemo(() => getNotificationProfile(roles), [roles])
    const [activeTab, setActiveTab] = useState('all')
    const [readIds, setReadIds] = useState(() => new Set())

    useEffect(() => {
        setActiveTab('all')
        setReadIds(new Set())
    }, [role])

    const notifications = useMemo(
        () => profile.notifications.map((notification) => ({
            ...notification,
            unread: notification.unread && !readIds.has(notification.id)
        })),
        [profile, readIds]
    )

    const unreadCount = notifications.filter((notification) => notification.unread).length

    const visibleNotifications = useMemo(() => {
        if (activeTab === 'all') return notifications
        if (activeTab === 'unread') return notifications.filter((notification) => notification.unread)
        return notifications.filter((notification) => notification.category === activeTab)
    }, [activeTab, notifications])

    const getTabCount = (tabKey) => {
        if (tabKey === 'all') return notifications.length
        if (tabKey === 'unread') return unreadCount
        return null
    }

    const markNotificationAsRead = (id) => {
        setReadIds((current) => new Set(current).add(id))
    }

    const markAllAsRead = () => {
        setReadIds((current) => {
            const next = new Set(current)
            notifications.forEach((notification) => next.add(notification.id))
            return next
        })
    }

    return (
        <section className='lx-p-notifications' aria-labelledby='lx-p-notifications-title'>
            <header className='lx-p-notifications-header'>
                <div>
                    <h1 id='lx-p-notifications-title'>{profile.title}</h1>
                    <p>{profile.subtitle}</p>
                </div>
                <button
                    className='lx-p-notifications-mark-all'
                    type='button'
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                >
                    Marcar todas como leídas
                </button>
            </header>

            <div className='lx-p-notifications-card'>
                <div className='lx-p-notifications-tabs' role='tablist' aria-label='Filtrar notificaciones'>
                    {profile.tabs.map((tab) => {
                        const count = getTabCount(tab.key)
                        const isActive = activeTab === tab.key

                        return (
                            <button
                                key={tab.key}
                                type='button'
                                role='tab'
                                aria-selected={isActive}
                                className={`lx-p-notifications-tab${isActive ? ' is-active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                                {count !== null && <span>({count})</span>}
                            </button>
                        )
                    })}
                </div>

                {visibleNotifications.length > 0 ? (
                    <ul className='lx-p-notifications-list'>
                        {visibleNotifications.map((notification) => (
                            <li key={notification.id}>
                                <button
                                    type='button'
                                    className={`lx-p-notifications-item${notification.unread ? ' is-unread' : ''}`}
                                    onClick={() => markNotificationAsRead(notification.id)}
                                    aria-label={notification.unread
                                        ? `Marcar como leída: ${notification.title}`
                                        : `Notificación leída: ${notification.title}`}
                                >
                                    <span className={`lx-p-notifications-icon lx-p-notifications-icon--${notification.tone}`}>
                                        <span className='material-symbols-rounded' aria-hidden='true'>{notification.icon}</span>
                                    </span>
                                    <span className='lx-p-notifications-content'>
                                        <span className='lx-p-notifications-title-row'>
                                            <span className='lx-p-notifications-item-title'>{notification.title}</span>
                                        </span>
                                        <span className='lx-p-notifications-description'>{notification.description}</span>
                                    </span>
                                    <span className='lx-p-notifications-meta'>
                                        <time>{notification.timestamp}</time>
                                        {notification.unread && <span className='lx-p-notifications-unread-dot' aria-hidden='true' />}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className='lx-p-notifications-empty'>
                        <span className='material-symbols-rounded' aria-hidden='true'>notifications_off</span>
                        <h2>No hay notificaciones</h2>
                        <p>{notifications.length === 0 ? 'Esta cuenta no tiene mensajes internos.' : 'No hay notificaciones en esta vista.'}</p>
                    </div>
                )}
            </div>
        </section>
    )
}

export default NotificationsPage
