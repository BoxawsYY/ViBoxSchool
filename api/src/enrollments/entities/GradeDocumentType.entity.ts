import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import Grade from './Grade.entity.js'
import DocumentType from './DocumentType.entity.js'

@Entity('GradeDocumentTypes')
export class GradeDocumentType {
    @Id()
    id: string

    @Column({ type: 'boolean', nullable: false, default: true })
    isRequired: boolean

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => Grade, { joinColumn: 'gradeId' })
    grade: Partial<Grade>

    @ManyToOne(() => DocumentType, { joinColumn: 'documentTypeId' })
    documentType: Partial<DocumentType>

    isActive: boolean
    isDeleted: boolean
}

export default GradeDocumentType
