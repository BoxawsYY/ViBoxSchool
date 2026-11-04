const BASE_PATH: unique symbol = Symbol('basePath')
const ROUTE: unique symbol = Symbol('route')
const AUTH: unique symbol = Symbol('auth')
const PUBLIC: unique symbol = Symbol('public')
const CONTROLLER: unique symbol = Symbol('controller')
const SERVICE: unique symbol = Symbol('service')
const REPOSITORY: unique symbol = Symbol('repository')
const ROUTER: unique symbol = Symbol('router')
const HANDLER: unique symbol = Symbol('handler')
const MIDDLEWARE: unique symbol = Symbol('middleware')
const INJECT: unique symbol = Symbol('inject')
const ENTITY: unique symbol = Symbol('entity')
const ID: unique symbol = Symbol('id')
const COLUMNS: unique symbol = Symbol('columns')
const RELATIONS: unique symbol = Symbol('relations')

export const METADATA_KEYS = {
    BASE_PATH,
    ROUTE,
    AUTH,
    PUBLIC,
    CONTROLLER,
    SERVICE,
    REPOSITORY,
    ROUTER,
    HANDLER,
    MIDDLEWARE,
    INJECT,
    ENTITY,
    ID,
    COLUMNS,
    RELATIONS
} as const