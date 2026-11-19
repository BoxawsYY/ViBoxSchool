export const NOTIFICATION_PROFILES = {
    Guardian: {
        label: 'Guardian',
        title: 'Notificaciones',
        subtitle: 'Mensajes internos del sistema',
        tabs: [
            { key: 'all', label: 'Todas' },
            { key: 'unread', label: 'Sin leer' },
            { key: 'payments', label: 'Pagos' },
            { key: 'documents', label: 'Documentos' }
        ]
    },
    Rector: {
        label: 'Rector',
        title: 'Notificaciones',
        subtitle: 'Mensajes internos del sistema',
        tabs: [
            { key: 'all', label: 'Todas' },
            { key: 'unread', label: 'Sin leer' },
            { key: 'documents', label: 'Documentos' },
            { key: 'reports', label: 'Reportes' }
        ]
    },
    Secretary: {
        label: 'Secretaría',
        title: 'Notificaciones',
        subtitle: 'Mensajes internos del sistema',
        tabs: [
            { key: 'all', label: 'Todas' },
            { key: 'unread', label: 'Sin leer' },
            { key: 'payments', label: 'Pagos' },
            { key: 'documents', label: 'Documentos' }
        ]
    }
}

export const DEFAULT_NOTIFICATION_PROFILE = {
    label: 'Cuenta',
    title: 'Notificaciones',
    subtitle: 'Mensajes internos del sistema',
    tabs: [
        { key: 'all', label: 'Todas' },
        { key: 'unread', label: 'Sin leer' }
    ]
}

export const getNotificationProfile = (roles = []) => {
    const priority = ['Rector', 'Secretary', 'Guardian']
    const match = priority.find((role) => roles.includes(role))

    return {
        role: match || null,
        profile: match ? NOTIFICATION_PROFILES[match] : DEFAULT_NOTIFICATION_PROFILE
    }
}
