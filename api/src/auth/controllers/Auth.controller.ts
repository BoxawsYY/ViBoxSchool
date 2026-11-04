import { Controller, Inject, Public, Get } from '../../core/decorators/decorators.js'
import BlockedTokenService from '../services/BlockedToken.service.js'

@Controller('/auth')
export class AuthController {

    constructor(
        @Inject(BlockedTokenService)
        private blockedTokenService: BlockedTokenService
    ) { }

    @Public()
    @Get('/')
    async index(request, response) {
        return response.status(200).send('Stepfive AuthService for Inno Project is running')
    }

    @Public()
    @Get('/health')
    async health(request, response) {
        return response.status(200).json({
            message: 'Stepfive AuthService for Inno Project is running',
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            service: 'auth',
            host: request.hostname,
            port: request.port,
            path: request.path,
            method: request.method,
            protocol: request.protocol,
            query: request.query,
            params: request.params,
            headers: request.headers,
            cookies: request.cookies,
            body: request.body,
            user: request.user,
            session: request.session,
            ip: request.ip,
            ips: request.ips,
            subdomains: request.subdomains,
            hostname: request.hostname,
            originalUrl: request.originalUrl,
            url: request.url,
            baseUrl: request.baseUrl,
            route: request.route
        })
    }

}