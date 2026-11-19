import { Column, Entity, Id } from '../../core/orm/decorators/decorators.js'

@Entity('Receipts')
export class Receipt {
    @Id() id: string
    @Column({ type: 'uuid', nullable: false }) schoolId: string
    @Column({ type: 'string', nullable: false }) type: string
    @Column({ type: 'bigint', nullable: false }) number: string
    @Column({ type: 'uuid', nullable: false, unique: true }) paymentId: string
    @Column({ type: 'uuid', nullable: true }) enrollmentId: string
    @Column({ type: 'date', nullable: false }) issuedAt: Date
    @Column({ type: 'text', nullable: false }) pdfUrl: string
    @Column({ type: 'text', nullable: false }) pdfBase64: string
    @Column({ type: 'text', nullable: true }) observations: string
}

export default Receipt
