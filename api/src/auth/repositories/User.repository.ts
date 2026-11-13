import { Repository } from "../../core/decorators/decorators.js"
import BaseRepository from "../../core/orm/repository/Base.repository.js"
import User from "../entities/User.entity.js"

@Repository()
export class UserRepository extends BaseRepository<User> {

    constructor() {
        super(User)
    }

    async findByLoginIdentifier(identifier: string) {
        const users = await this.raw(`
            SELECT * FROM "Users"
            WHERE LOWER("username") = LOWER($1) OR LOWER("email") = LOWER($1)
            ORDER BY CASE WHEN LOWER("username") = LOWER($1) THEN 0 ELSE 1 END
            LIMIT 1
        `, [identifier.trim()])
        return users[0] || null
    }

}

export default UserRepository