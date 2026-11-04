import DTO from "../../core/orm/dto/Base.dto.js"
import User from "../entities/User.entity.js"

export class UserDTO extends DTO<User> {
    constructor(entity: Partial<User>) {
        super(entity, ['password'])
    }
}

export default UserDTO