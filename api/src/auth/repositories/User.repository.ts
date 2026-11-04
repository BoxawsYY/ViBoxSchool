import { Repository } from "../../core/decorators/decorators.js"
import BaseRepository from "../../core/orm/repository/Base.repository.js"
import User from "../entities/User.entity.js"

@Repository()
export class UserRepository extends BaseRepository<User> {

    constructor() {
        super(User)
    }

}

export default UserRepository