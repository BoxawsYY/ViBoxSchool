import BlockedTokenRepository from "../repositories/BlockedToken.repository.js"
import { Inject, Service } from "../../core/decorators/decorators.js"
import BlockedToken from "../entities/BlockedToken.entity.js"

@Service()
export class BlockedTokenService {

    constructor(
        @Inject(BlockedTokenRepository)
        private blockedTokenRepository: BlockedTokenRepository
    ) { }

    async findAll() {
        return this.blockedTokenRepository.findAll()
    }

    async findById(id: string) {
        return this.blockedTokenRepository.findById(id)
    }

    async existsBlockedTokenByToken(token: string) {
        const blockedToken = await this.blockedTokenRepository.findOneBy('token', token)
        return !!blockedToken
    }

    async create(blockedToken: Partial<BlockedToken>) {
        return this.blockedTokenRepository.create(blockedToken)
    }

    async update(id: string, blockedToken: Partial<BlockedToken>) {
        return this.blockedTokenRepository.update(id, blockedToken)
    }

    async delete(id: string) {
        return this.blockedTokenRepository.delete(id)
    }

}

export default BlockedTokenService