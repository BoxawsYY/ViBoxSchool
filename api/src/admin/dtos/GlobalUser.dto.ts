/**
 * Representación de un usuario en el panel "Usuarios globales".
 * Nunca incluye la contraseña.
 */
export class GlobalUserDTO {
    id: string
    name: string
    username: string
    email: string
    documentType: string | null
    documentNumber: string | null
    phoneNumber: string | null
    gender: string | null
    birthdate: Date | null
    country: string | null
    city: string | null
    address: string | null
    image: string | null
    role: string | null
    roleAlias: string | null
    schoolId: string | null
    schoolName: string | null
    schoolBrandColor: string | null
    studentId: string | null
    studentName: string | null
    relationship: string | null
    status: 'active' | 'blocked'
    lastLogin: Date | null
    registerDate: Date | null

    constructor(row: any) {
        this.id = row.id
        this.name = row.name
        this.username = row.username
        this.email = row.email
        this.documentType = row.documentType ?? null
        this.documentNumber = row.documentNumber ?? null
        this.phoneNumber = row.phoneNumber ?? null
        this.gender = row.gender ?? null
        this.birthdate = row.birthdate ?? null
        this.country = row.country ?? null
        this.city = row.city ?? null
        this.address = row.address ?? null
        this.image = row.image ?? null
        this.role = row.role ?? null
        this.roleAlias = row.roleAlias ?? null
        this.schoolId = row.schoolId ?? null
        this.schoolName = row.schoolName ?? null
        this.schoolBrandColor = row.schoolBrandColor ?? null
        this.studentId = row.studentId ?? null
        this.studentName = row.studentName ?? null
        this.relationship = row.relationship ?? null
        this.status = row.isAuthorized === false ? 'blocked' : 'active'
        this.lastLogin = row.lastLogin ?? null
        this.registerDate = row.registerDate ?? null
    }
}

export default GlobalUserDTO
