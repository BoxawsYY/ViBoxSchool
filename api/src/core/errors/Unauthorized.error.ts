import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class UnauthorizedError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.UNAUTHORIZED,
            message: message || 'Unauthorized',
            status: 401,
            ...constructor
        })
    }
}