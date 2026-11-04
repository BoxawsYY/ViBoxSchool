import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'all'

const createRouteDecorator = (method: HttpMethod) => {
    return (path: string) => {
        return (target, key, descriptor: PropertyDescriptor) => {
            Metadata.set(descriptor.value, METADATA_KEYS.ROUTE, {
                method,
                path
            })
        }
    }
}

export const Get = createRouteDecorator('get')
export const Post = createRouteDecorator('post')
export const Put = createRouteDecorator('put')
export const Delete = createRouteDecorator('delete')
export const Patch = createRouteDecorator('patch')
export const Head = createRouteDecorator('head')
export const Options = createRouteDecorator('options')
export const All = createRouteDecorator('all')