import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import EnrollmentDraft from './EnrollmentDraft.entity.js'
import DocumentType from './DocumentType.entity.js'

@Entity('EnrollmentDraftDocuments')
export class EnrollmentDraftDocument {
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

    @Column({ type: 'bigint', nullable: false })
    sizeBytes: string

    @Column({ type: 'number', nullable: true })
    widthPx: number

    @Column({ type: 'number', nullable: true })
    heightPx: number

    @Column({ type: 'string', nullable: false, default: 'pending' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => EnrollmentDraft, { joinColumn: 'draftId' })
    draft: Partial<EnrollmentDraft>

    @ManyToOne(() => DocumentType, { joinColumn: 'documentTypeId' })
    documentType: Partial<DocumentType>

    isActive: boolean
    isDeleted: boolean
}

export default EnrollmentDraftDocument
