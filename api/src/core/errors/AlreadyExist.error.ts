import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class AlreadyExistError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.ALREADY_EXIST,
            message: message || 'Already exist',
            status: 409,
            ...constructor
        })
    }
}