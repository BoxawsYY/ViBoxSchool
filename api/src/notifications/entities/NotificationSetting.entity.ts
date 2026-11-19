import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import User from '../../auth/entities/User.entity.js'

@Entity('NotificationSettings')
export class NotificationSetting {

    @Id()
    id: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    schoolId: string

    @ManyToOne(() => User, { joinColumn: 'definedById' })
    definedBy: Partial<User>

    definedById: string | null

    @Column({ type: 'string', nullable: false })
    eventType: string

    @Column({ type: 'string', nullable: false })
    channel: string

    @Column({ type: 'number', nullable: true })
    daysBefore: number | null

    @Column({ type: 'text', nullable: false })
    template: string

    @Column({ type: 'string', nullable: true })
    sendTime: string | null

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    isActive: boolean

    isDeleted: boolean

}

export default NotificationSetting
