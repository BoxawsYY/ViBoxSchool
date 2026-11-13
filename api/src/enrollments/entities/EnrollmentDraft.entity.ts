import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import GradePeriod from './GradePeriod.entity.js'
import EnrollmentPeriod from './EnrollmentPeriod.entity.js'

@Entity('EnrollmentDrafts')
export class EnrollmentDraft {
    @Id()
    id: string

    @Column({ type: 'json', nullable: false })
    studentData: Record<string, unknown>

    @Column({ type: 'json', nullable: false })
    guardianData: Record<string, unknown>

    @Column({ type: 'string', nullable: false })
    accessTokenHash: string

    @Column({ type: 'date', nullable: false })
    expiresAt: Date

    @Column({ type: 'string', nullable: false, default: 'draft' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => GradePeriod, { joinColumn: 'gradePeriodId' })
    gradePeriod: Partial<GradePeriod>

    @ManyToOne(() => EnrollmentPeriod, { joinColumn: 'periodId' })
    period: Partial<EnrollmentPeriod>

    isActive: boolean
    isDeleted: boolean
}

export default EnrollmentDraft
