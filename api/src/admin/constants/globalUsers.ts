import { ROLES } from '../../auth/constants/authorities.js'

/** Roles que se gestionan desde "Usuarios globales". */
export const MANAGED_ROLES = [ROLES.ADMIN, ROLES.RECTOR, ROLES.SECRETARY, ROLES.GUARDIAN] as const

/** Roles que obligatoriamente pertenecen a un colegio. */
export const SCHOOL_ROLES: string[] = [ROLES.RECTOR, ROLES.SECRETARY, ROLES.GUARDIAN]

export const USER_STATUS = {
    ACTIVE: 'active',
    BLOCKED: 'blocked'
} as const

/** Parentescos válidos (mismos valores que usa el wizard de matrícula). */
export const RELATIONSHIPS = ['mother', 'father', 'guardian', 'other']

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100
