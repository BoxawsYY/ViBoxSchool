import { Metadata } from '../../metadata/Metadata.js'
import { METADATA_KEYS } from '../../metadata/keys.js'

export function Id() {
    return function (target: any, propertyKey: string) {
        Metadata.set(target.constructor, METADATA_KEYS.ID, propertyKey)
        
        const columns = Metadata.get(target.constructor, METADATA_KEYS.COLUMNS) || {}
        columns[propertyKey] = {
            type: 'uuid',
            nullable: false,
            unique: true
        }
        Metadata.set(target.constructor, METADATA_KEYS.COLUMNS, columns)
    }
}
