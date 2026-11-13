import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import Enrollment from './Enrollment.entity.js'
import DocumentType from './DocumentType.entity.js'
import User from '../../auth/entities/User.entity.js'

@Entity('EnrollmentDocuments')
export class EnrollmentDocument {
    @Id()
    id: string

    @Column({ type: 'number', nullable: false, default: 1 })
    version: number

    @Column({ type: 'string', nullable: false })
    fileUrl: string

    @Column({ type: 'string', nullable: true })
    storagePath: string

    @Column({ type: 'string', nullable: false })
    fileName: string

    @Column({ type: 'string', nullable: false })
    mimeType: string

    @Column({ type: 'bigint', nullable: true })
    sizeBytes: string

    @Column({ type: 'number', nullable: true })
    widthPx: number

    @Column({ type: 'number', nullable: true })
    heightPx: number

    @Column({ type: 'string', nullable: false, default: 'pending' })
    status: string

    @Column({ type: 'date', nullable: true })
    reviewedAt: Date

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => Enrollment, { joinColumn: 'enrollmentId' })
    enrollment: Partial<Enrollment>

    @ManyToOne(() => DocumentType, { joinColumn: 'documentTypeId' })
    documentType: Partial<DocumentType>

    @ManyToOne(() => User, { joinColumn: 'reviewedById' })
    reviewedBy: Partial<User>

    isActive: boolean
    isDeleted: boolean
}

export default EnrollmentDocument
