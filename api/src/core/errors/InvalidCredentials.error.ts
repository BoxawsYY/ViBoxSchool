import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class InvalidCredentialError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.INVALID_CREDENTIALS,
            message: message || 'Invalid credentials',
            status: 401,
            ...constructor
        })
    }
}