import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class ForbiddenError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.FORBIDDEN,
            message: message || 'Forbidden',
            status: 403,
            ...constructor
        })
    }
}