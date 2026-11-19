import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import User from '../../auth/entities/User.entity.js'

@Entity('Notifications')
export class Notification {

    @Id()
    id: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    schoolId: string

    @ManyToOne(() => User, { joinColumn: 'recipientUserId' })
    recipient: Partial<User>

    recipientUserId: string

    @Column({ type: 'uuid', nullable: true })
    settingId: string | null

    @Column({ type: 'string', nullable: false })
    eventType: string

    @Column({ type: 'string', nullable: true })
    subject: string

    @Column({ type: 'string', nullable: false })
    message: string

    @Column({ type: 'string', nullable: true })
    entityType: string

    @Column({ type: 'uuid', nullable: true })
    entityId: string

    @Column({ type: 'boolean', nullable: false, default: false })
    isRead: boolean

    @Column({ type: 'date', nullable: true })
    readAt: Date

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    isActive: boolean

    isDeleted: boolean

}

export default Notification
