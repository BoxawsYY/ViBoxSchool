import { Metadata } from '../../metadata/Metadata.js'
import { METADATA_KEYS } from '../../metadata/keys.js'
import { EntityRegistry } from '../metadata/orm.registry.js'

export function Entity(tableName: string) {
    return function (target: any) {
        Metadata.set(target, METADATA_KEYS.ENTITY, { tableName })
        EntityRegistry.add(target)
    }
}
