import './NotificationsPage.css'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../core/contexts/AuthContext'
import Notify from '../../../../core/lib/notify.mjs'
import NotificationsRequester from '../../services/NotificationsRequester.mjs'
import { getNotificationProfile } from './notifications.config.mjs'

const getSessionRoles = (session) => {
    const roles = Array.isArray(session?.user?.roles) ? session.user.roles : []
    const fallbackRole = session?.user?.role ? [session.user.role] : []

    return [...new Set([...roles, ...fallbackRole])]
}

const TYPE_META = {
    payment_reminder:        { tone: 'warning', icon: 'priority_high', category: 'payments' },
    late_payment:            { tone: 'danger',  icon: 'priority_high', category: 'payments' },
    documents_pending:       { tone: 'info',    icon: 'mail',          category: 'documents' },
    observation:             { tone: 'info',    icon: 'visibility',    category: 'documents' },
    payment_confirmation:    { tone: 'success', icon: 'credit_card',   category: 'payments' },
    enrollment_confirmation: { tone: 'success', icon: 'check',         category: 'documents' },
    new_enrollment_request:  { tone: 'info',    icon: 'description',   category: 'documents' },
    payment_registered:      { tone: 'success', icon: 'payments',      category: 'payments' },
    manual:                  { tone: 'info',    icon: 'mail',          category: 'manual' }
}

const META_DEFAULT = { tone: 'info', icon: 'notifications', category: 'manual' }

const EVENT_TARGETS = {
    Guardian: {
        documents_pending: '/panel/guardian/enrollment-documents',
        enrollment_confirmation: '/panel/guardian/enrollment-documents',
        new_enrollment_request: '/panel/guardian/enrollment-documents',
        payment_reminder: '/panel/guardian/account',
        late_payment: '/panel/guardian/account',
        payment_confirmation: '/panel/guardian/account',
        payment_registered: '/panel/guardian/account'
    },
    Secretary: {
        documents_pending: '/panel/secretary/enrollments',
        enrollment_confirmation: '/panel/secretary/enrollments',
        new_enrollment_request: '/panel/secretary/enrollments',
        payment_reminder: '/panel/secretary/cash-payment',
        late_payment: '/panel/secretary/cash-payment',
        payment_confirmation: '/panel/secretary/payment-sheets',
        payment_registered: '/panel/secretary/payment-sheets'
    },
    Rector: {
        documents_pending: '/panel/rector/document-verification',
        enrollment_confirmation: '/panel/rector/document-verification',
        new_enrollment_request: '/panel/rector/document-verification'
    }
}

const formatTimestamp = (iso) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)
    const time = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    if (diffDays === 0) return `Hoy ${time}`
    if (diffDays === 1) return `Ayer ${time}`
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

const rowToView = (row) => {
    const meta = TYPE_META[row.eventType] ?? META_DEFAULT

    return {
        id: row.id,
        eventType: row.eventType,
        title: row.subject || 'Notificación',
        description: row.message,
        timestamp: formatTimestamp(row.createdAt),
        category: meta.category,
        tone: meta.tone,
        icon: meta.icon,
        unread: !row.isRead
    }
}

const NotificationsPage = () => {
    const { session } = useAuth()
    const navigate = useNavigate()
    const roles = useMemo(() => getSessionRoles(session), [session])
    const { role, profile } = useMemo(() => getNotificationProfile(roles), [roles])

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        setActiveTab('all')
    }, [role])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            try {
                const data = await NotificationsRequester.list({ limit: 50, offset: 0 })
                if (cancelled) return
                setItems((data?.items ?? []).map(rowToView))
            } catch (err) {
                if (!cancelled) {
                    setItems([])
                    Notify.notice(err?.message || 'No se pudieron cargar las notificaciones', 'error')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [role])

    const notifications = items
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

    const notifyChanged = () => {
        window.dispatchEvent(new Event('notifications:changed'))
    }

    const targetFor = (notification) => (role ? EVENT_TARGETS[role]?.[notification.eventType] : null) ?? null

    const handleNotificationPress = (notification) => {
        markNotificationAsRead(notification.id)
        const target = targetFor(notification)
        if (target) navigate(target)
    }

    const markNotificationAsRead = async (id) => {
        const target = notifications.find((notification) => notification.id === id)
        if (!target?.unread) return

        setItems((current) => current.map((notification) => (
            notification.id === id ? { ...notification, unread: false } : notification
        )))

        try {
            await NotificationsRequester.markRead(id)
        } catch (err) {
            setItems((current) => current.map((notification) => (
                notification.id === id ? { ...notification, unread: true } : notification
            )))
            Notify.notice(err?.message || 'No se pudo marcar como leída', 'error')
        } finally {
            notifyChanged()
        }
    }

    const markAllAsRead = async () => {
        if (unreadCount === 0) return

        const previous = notifications
        setItems((current) => current.map((notification) => ({ ...notification, unread: false })))

        try {
            await NotificationsRequester.markAllRead()
        } catch (err) {
            setItems(previous)
            Notify.notice(err?.message || 'No se pudieron marcar las notificaciones', 'error')
        } finally {
            notifyChanged()
        }
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

                {loading ? (
                    <div className='lx-p-notifications-empty'>
                        <span className='material-symbols-rounded' aria-hidden='true'>progress_activity</span>
                        <h2>Cargando…</h2>
                        <p>Obteniendo tus notificaciones.</p>
                    </div>
                ) : visibleNotifications.length > 0 ? (
                    <ul className='lx-p-notifications-list'>
                        {visibleNotifications.map((notification) => (
                            <li key={notification.id}>
                                <button
                                    type='button'
                                    className={`lx-p-notifications-item${notification.unread ? ' is-unread' : ''}`}
                                    onClick={() => handleNotificationPress(notification)}
                                    aria-label={targetFor(notification)
                                        ? `Ir a: ${notification.title}`
                                        : notification.unread
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
