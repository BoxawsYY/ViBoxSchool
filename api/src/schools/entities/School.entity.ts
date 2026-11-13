import { Column, Entity, Id } from '../../core/orm/decorators/decorators.js'

@Entity('Schools')
export class School {

    @Id()
    id: string

    @Column({ type: 'string', nullable: false, unique: true })
    code: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'string', nullable: false, unique: true })
    nit: string

    @Column({ type: 'string', nullable: false })
    city: string

    @Column({ type: 'string' })
    department: string

    @Column({ type: 'string' })
    address: string

    @Column({ type: 'string' })
    phone: string

    @Column({ type: 'string' })
    email: string

    @Column({ type: 'string' })
    secretaryEmail: string

    @Column({ type: 'string' })
    officeHours: string

    @Column({ type: 'string' })
    levelsOffered: string

    @Column({ type: 'string' })
    description: string

    @Column({ type: 'string' })
    logoUrl: string

    @Column({ type: 'string' })
    brandColor: string

    @Column({ type: 'boolean', nullable: false, default: false })
    isPartner: boolean

    @Column({ type: 'string', nullable: false, default: 'onboarding' })
    status: string

    isActive: boolean
    isDeleted: boolean
    createdAt: Date
    createdBy: string
    updatedAt: Date
    updatedBy: string
    deletedAt: Date
    deletedBy: string
}

export default School
