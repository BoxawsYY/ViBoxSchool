import { Repository } from "../../core/decorators/decorators.js"
import BaseRepository from "../../core/orm/repository/Base.repository.js"
import BlockedToken from "../entities/BlockedToken.entity.js"

@Repository()
export class BlockedTokenRepository extends BaseRepository<BlockedToken> {
    constructor() {
        super(BlockedToken)
    }
}

export default BlockedTokenRepository