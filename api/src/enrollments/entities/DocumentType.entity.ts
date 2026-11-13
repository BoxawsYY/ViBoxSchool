import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'

@Entity('DocumentTypes')
export class DocumentType {
    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'string', nullable: true })
    description: string

    @Column({ type: 'string', nullable: false })
    allowedMimeType: string

    @Column({ type: 'bigint', nullable: false })
    maxSizeBytes: string

    @Column({ type: 'number', nullable: true })
    minWidthPx: number

    @Column({ type: 'number', nullable: true })
    minHeightPx: number

    @Column({ type: 'number', nullable: true })
    maxWidthPx: number

    @Column({ type: 'number', nullable: true })
    maxHeightPx: number

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    isActive: boolean
    isDeleted: boolean
}

export default DocumentType
