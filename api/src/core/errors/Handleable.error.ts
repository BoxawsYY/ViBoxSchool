export interface HandleableErrorConstructor {
    code?: string
    message?: string
    status?: number
}

export class HandleableError extends Error {
    public code: string
    public status: number
    public type: string

    constructor({ code, message, status }: HandleableErrorConstructor) {
        super(message)
        this.code = code
        this.status = status
        this.type = this.constructor.name
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            status: this.status,
            type: this.type
        }
    }

}

export default HandleableError