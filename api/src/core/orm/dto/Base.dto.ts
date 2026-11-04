export class DTO<T> {

    constructor(entity: Partial<T>, excepting: string[] = []) {
        Object.keys(entity).forEach(attribute => {
            if (!excepting.includes(attribute)) {
                this[attribute] = entity[attribute]
            }
        })
    }

}

export default DTO