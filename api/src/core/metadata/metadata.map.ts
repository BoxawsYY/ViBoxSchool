import { METADATA_KEYS } from './keys.js'
import type { EntityConfig, ColumnConfig, RelationConfig } from '../orm/metadata/orm.metadata.js'

export interface MetadataMap {
    [METADATA_KEYS.BASE_PATH]: string

    [METADATA_KEYS.ROUTE]: {
        method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'all'
        path: string
    }

    [METADATA_KEYS.AUTH]: {
        roles?: string[]
        permissions?: string[]
    }

    [METADATA_KEYS.PUBLIC]: boolean

    [METADATA_KEYS.CONTROLLER]: boolean

    [METADATA_KEYS.SERVICE]: boolean

    [METADATA_KEYS.REPOSITORY]: boolean

    [METADATA_KEYS.ROUTER]: boolean

    [METADATA_KEYS.HANDLER]: boolean

    [METADATA_KEYS.MIDDLEWARE]: boolean

    [METADATA_KEYS.INJECT]: any[]

    [METADATA_KEYS.ENTITY]: EntityConfig

    [METADATA_KEYS.ID]: string

    [METADATA_KEYS.COLUMNS]: Record<string, ColumnConfig>

    [METADATA_KEYS.RELATIONS]: Record<string, RelationConfig>

}