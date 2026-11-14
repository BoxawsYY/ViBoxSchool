import { Column, Entity, Id, OneToOne } from '../../core/orm/decorators/decorators.js'
import User from '../../auth/entities/User.entity.js'

@Entity('Guardians')
export class Guardian {
    @Id()
    id: string

    @Column({ type: 'string', nullable: true })
    whatsapp: string

    @Column({ type: 'string', nullable: true })
    phone: string

    @Column({ type: 'string', nullable: true })
    address: string

    @Column({ type: 'boolean', nullable: false, default: true })
    emailNotifications: boolean

    @Column({ type: 'boolean', nullable: false, default: true })
    whatsappNotifications: boolean

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @OneToOne(() => User, { joinColumn: 'userId' })
    user: Partial<User>

    isActive: boolean
    isDeleted: boolean
}

export default Guardian
