import { Metadata } from '../../metadata/Metadata.js'
import { METADATA_KEYS } from '../../metadata/keys.js'
import { ColumnConfig } from '../metadata/orm.metadata.js'

export function Column(options: Partial<ColumnConfig> = {}) {
    return function (target: any, propertyKey: string) {
        const jsType = Reflect.getMetadata('design:type', target, propertyKey)
        
        const columns = Metadata.get(target.constructor, METADATA_KEYS.COLUMNS) || {}
        columns[propertyKey] = { ...options, jsType }
        Metadata.set(target.constructor, METADATA_KEYS.COLUMNS, columns)
    }
}
