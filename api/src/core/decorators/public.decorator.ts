import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export const Public = () => {
    return (target, key, descriptor: PropertyDescriptor) => {
        Metadata.set(descriptor.value, METADATA_KEYS.PUBLIC, true)
    }
}