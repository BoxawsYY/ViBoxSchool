import 'reflect-metadata'
import type { MetadataMap } from './metadata.map.js'

export class Metadata {

    static set<K extends keyof MetadataMap>(
        target: any,
        key: K,
        value: MetadataMap[K]
    ) {
        Reflect.defineMetadata(key, value, target)
    }

    static get<K extends keyof MetadataMap>(
        target: any,
        key: K
    ): MetadataMap[K] | undefined {
        return Reflect.getMetadata(key, target)
    }

    static has<K extends keyof MetadataMap>(
        target: any,
        key: K
    ): boolean {
        return Reflect.hasMetadata(key, target)
    }

    static merge<K extends keyof MetadataMap>(
        target: any,
        key: K,
        value: Partial<MetadataMap[K]>
    ) {
        const existing = Reflect.getMetadata(key, target) || {}

        Reflect.defineMetadata(
            key,
            { ...existing, ...value },
            target
        )
    }
}