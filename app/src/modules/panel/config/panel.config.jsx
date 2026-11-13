import Dashboard from '../pages/Dashboard/Dashboard'
import Users from '../pages/Users/Users'
import Authorization from '../pages/Authorization/Authorization'
import SchoolManagementPage from '../../admin/pages/SchoolManagement/SchoolManagementPage'
import DevelopmentPage from '../pages/Development/DevelopmentPage'

export const AUTHORITIES = {
  PANEL: {
    roles: ['Rector', 'Secretary', 'Guardian']
  }
}

export const MENU = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    description: 'Resumen general del sistema',
    to: '',
    path: '',
    isBase: true,
    element: <Dashboard />,
    authorities: {
      permissions: ['AccessDashboard']
    },
    items: []
  },
  {
    label: 'Autorizaciones',
    icon: 'shield_toggle',
    description: 'Gestión de roles y permisos',
    to: 'authorization',
    path: 'authorization',
    element: <Authorization />,
    authorities: {
      permissions: ['AccessAuthorization']
    },
    items: []
  },
  {
    label: 'Usuarios',
    icon: 'shield_person',
    description: 'Gestión de cuentas de usuarios',
    to: 'users',
    path: 'users/:userId?',
    element: <Users />,
    authorities: {
      permissions: ['AccessUsers']
    },
    items: []
  }
]

export const ADMIN_MENU = [
  {
    label: 'Colegios',
    section: 'Plataforma',
    icon: 'account_balance',
    description: 'Gestión global de colegios aliados',
    to: '/admin/schools',
    path: 'schools',
    element: <SchoolManagementPage />,
    authorities: {
      roles: ['Admin']
    },
    items: []
  },
  {
    label: 'Usuarios globales',
    section: 'Accesos',
    icon: 'person',
    description: 'Gestión global de usuarios',
    to: '/admin/users',
    path: 'users',
    element: <DevelopmentPage title='Usuarios globales' />,
    authorities: { roles: ['Admin'] },
    items: []
  },
  {
    label: 'Auditoría',
    section: 'Sistema',
    icon: 'monitoring',
    description: 'Auditoría de actividad de la plataforma',
    to: '/admin/audit',
    path: 'audit',
    element: <DevelopmentPage title='Auditoría' />,
    authorities: { roles: ['Admin'] },
    items: []
  },
  {
    label: 'Correos',
    section: 'Sistema',
    icon: 'mail',
    description: 'Historial y gestión de correos',
    to: '/admin/emails',
    path: 'emails',
    element: <DevelopmentPage title='Correos' />,
    authorities: { roles: ['Admin'] },
    items: []
  },
  {
    label: 'Parámetros globales',
    section: 'Sistema',
    icon: 'tune',
    description: 'Parámetros globales',
    to: '/admin/parameters',
    path: 'parameters',
    element: <DevelopmentPage title='Parámetros globales' />,
    authorities: { roles: ['Admin'] },
    items: []
  }
]

const roleItem = (role, label, slug, icon, section = 'Gestión') => ({
  label,
  section,
  icon,
  description: label,
  to: `/panel/${role.toLowerCase()}/${slug}`,
  path: `${role.toLowerCase()}/${slug}`,
  element: <DevelopmentPage title={label} />,
  authorities: { roles: [role] },
  items: []
})

const roleDashboard = (role, label, icon = 'dashboard') => ({
  label,
  section: '',
  icon,
  description: label,
  to: '/panel',
  path: '',
  isBase: true,
  element: <Dashboard />,
  authorities: { roles: [role] },
  items: []
})

export const ROLE_MENUS = {
  Rector: [
    roleDashboard('Rector', 'Panel'),
    roleItem('Rector', 'Parámetros del colegio', 'settings', 'tune', 'Administración'),
    roleItem('Rector', 'Verificación de documentos', 'document-verification', 'verified_user'),
    roleItem('Rector', 'Reportes', 'reports', 'bar_chart'),
    roleItem('Rector', 'Notificaciones', 'notifications', 'notifications', 'Comunicación')
  ],
  Secretary: [
    roleDashboard('Secretary', 'Panel de control'),
    roleItem('Secretary', 'Matrículas', 'enrollments', 'assignment'),
    roleItem('Secretary', 'Registrar pago en efectivo', 'cash-payment', 'payments'),
    roleItem('Secretary', 'Planillas de pago', 'payment-sheets', 'receipt_long'),
    roleItem('Secretary', 'Notificaciones', 'notifications', 'notifications', 'Comunicación')
  ],
  Guardian: [
    roleDashboard('Guardian', 'Inicio', 'home'),
    roleItem('Guardian', 'Matrícula y documentos', 'enrollment-documents', 'description'),
    roleItem('Guardian', 'Estado de cuenta', 'account', 'account_balance_wallet'),
    roleItem('Guardian', 'Pagar', 'payments', 'payments'),
    roleItem('Guardian', 'Notificaciones', 'notifications', 'notifications', 'Comunicación')
  ]
}

export const PANEL_ROUTE_MENUS = Object.values(ROLE_MENUS).flat()
