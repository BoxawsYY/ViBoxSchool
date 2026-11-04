import Dashboard from '../pages/Dashboard/Dashboard'
import Users from '../pages/Users/Users'
import Authorization from '../pages/Authorization/Authorization'

export const AUTHORITIES = {
  PANEL: {
    roles: []
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
