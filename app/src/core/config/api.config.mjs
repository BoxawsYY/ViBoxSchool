const ENV = import.meta.env;

export const IS_DEV_MODE = ENV.VITE_IS_DEV_MODE === 'true'
    || (ENV.VITE_IS_DEV_MODE !== 'false' && ENV.DEV);

export const URL_BASE = IS_DEV_MODE
    ? ENV.VITE_API_URL_DEV || 'http://localhost:3000/api/v1'
    : ENV.VITE_API_URL_PROD || '/api/v1';

class EndpointGroup {
    constructor(base = '', paths = {}) {
        this.BASE = base
        this.ENDPOINTS = {
            BASE: base
        }
        Object.keys(paths).forEach(path => {
            this.ENDPOINTS[path] = this.BASE + `/${paths[path]}`
        })
    }
}

export const API = {
    SCHOOLS: new EndpointGroup(`${URL_BASE}/schools`, {
        DISCOVER: 'discover',
    }),
    AUTH: new EndpointGroup(`${URL_BASE}/auth`, {
        SIGNIN: 'login',
        SIGNOUT: 'logout',
        SIGNUP: 'register',
        SESSION: 'session',
        REFRESH: 'refresh',
        ROLES: 'roles',
        ASSIGN_ROLE_TO_USER: 'assign/roles',
        REVOKE_ROLE_FROM_USER: 'revoke/roles',
        ACTIVATE_ROLE: 'activate/roles',
        DEACTIVATE_ROLE: 'deactivate/roles',
        PERMISSIONS: 'permissions',
        ASSIGN_PERMISSION_TO_ROLE: 'assign/permissions',
        REVOKE_PERMISSION_FROM_ROLE: 'revoke/permissions',
        USERS: 'users',
        AUTHORIZE: 'authorize',
        DISAUTHORIZE: 'disauthorize',
    })
}

export default API