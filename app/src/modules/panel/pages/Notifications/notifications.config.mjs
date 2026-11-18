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
        ],
        notifications: [
            {
                id: 'guardian-1',
                title: 'Pensión de febrero vencida',
                description: 'Tu pensión venció el 5 de febrero. Paga hoy para evitar más recargos.',
                timestamp: 'Hoy 8:00',
                category: 'payments',
                tone: 'danger',
                icon: 'priority_high',
                unread: true
            },
            {
                id: 'guardian-2',
                title: 'Recargo por mora aplicado',
                description: 'Se sumaron $19.500 al saldo de la pensión de febrero.',
                timestamp: 'Hoy 8:00',
                category: 'payments',
                tone: 'warning',
                icon: 'receipt_long',
                unread: true
            },
            {
                id: 'guardian-3',
                title: 'Matrícula pendiente de pago',
                description: 'Tu matrícula 2027 vence el 15 de febrero ($780.000).',
                timestamp: 'Ayer 8:00',
                category: 'payments',
                tone: 'warning',
                icon: 'payments',
                unread: true
            },
            {
                id: 'guardian-4',
                title: 'Documentos verificados',
                description: 'Rectoría aprobó los 5 documentos de Juan Esteban.',
                timestamp: '14 ene',
                category: 'documents',
                tone: 'success',
                icon: 'check',
                unread: false
            },
            {
                id: 'guardian-5',
                title: 'Solicitud de matrícula recibida',
                description: 'Tu expediente EXP-2027-00184 fue creado correctamente.',
                timestamp: '12 ene',
                category: 'documents',
                tone: 'info',
                icon: 'mail',
                unread: false
            }
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
        ],
        notifications: [
            {
                id: 'rector-1',
                title: '23 expedientes esperan verificación',
                description: 'Hay documentos cargados que requieren tu aprobación.',
                timestamp: 'Hoy 9:20',
                category: 'documents',
                tone: 'warning',
                icon: 'description',
                unread: true
            },
            {
                id: 'rector-2',
                title: 'Cierre del periodo de matrícula',
                description: 'El periodo 2027 cierra el 31 de enero. Quedan 42 cupos.',
                timestamp: 'Hoy 8:00',
                category: 'system',
                tone: 'info',
                icon: 'schedule',
                unread: true
            },
            {
                id: 'rector-3',
                title: 'Secretaría registró 9 pagos en efectivo',
                description: 'Total del día: $4.230.000.',
                timestamp: 'Ayer 16:45',
                category: 'reports',
                tone: 'success',
                icon: 'payments',
                unread: false
            },
            {
                id: 'rector-4',
                title: 'Reporte semanal de recaudo disponible',
                description: 'Ya puedes descargarlo en PDF o Excel.',
                timestamp: 'Lun 7:00',
                category: 'reports',
                tone: 'info',
                icon: 'bar_chart',
                unread: false
            },
            {
                id: 'rector-5',
                title: 'Respaldo semanal completado',
                description: 'El respaldo automático finalizó sin errores.',
                timestamp: 'Dom 2:00',
                category: 'system',
                tone: 'success',
                icon: 'shield',
                unread: false
            }
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
        ],
        notifications: [
            {
                id: 'secretary-1',
                title: 'Nuevo expediente para revisar',
                description: 'Juan Esteban Ortiz cargó 5 documentos (EXP-2027-00184).',
                timestamp: 'Hoy 9:15',
                category: 'documents',
                tone: 'info',
                icon: 'description',
                unread: true
            },
            {
                id: 'secretary-2',
                title: 'Pago PSE confirmado',
                description: 'Camilo Herrera Sosa · $450.000 · pensión febrero.',
                timestamp: 'Hoy 8:47',
                category: 'payments',
                tone: 'success',
                icon: 'credit_card',
                unread: true
            },
            {
                id: 'secretary-3',
                title: 'Falló el envío de una notificación',
                description: 'No se pudo enviar el correo a diana.pena@correo.com.',
                timestamp: 'Hoy 8:12',
                category: 'system',
                tone: 'danger',
                icon: 'priority_high',
                unread: false
            },
            {
                id: 'secretary-4',
                title: 'Estudiante en mora',
                description: 'Mariana Torres Gil acumula 21 días de atraso.',
                timestamp: 'Ayer 16:30',
                category: 'payments',
                tone: 'warning',
                icon: 'priority_high',
                unread: false
            },
            {
                id: 'secretary-5',
                title: 'Planilla de febrero generada',
                description: 'La planilla de pagos de febrero 2027 está disponible.',
                timestamp: '1 feb',
                category: 'payments',
                tone: 'info',
                icon: 'description',
                unread: false
            }
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
    ],
    notifications: []
}

export const getNotificationProfile = (roles = []) => {
    const priority = ['Rector', 'Secretary', 'Guardian']
    const match = priority.find((role) => roles.includes(role))

    return {
        role: match || null,
        profile: match ? NOTIFICATION_PROFILES[match] : DEFAULT_NOTIFICATION_PROFILE
    }
}
