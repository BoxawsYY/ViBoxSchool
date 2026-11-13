import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Inject, Service } from '../../core/decorators/decorators.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import EnrollmentRepository from '../repositories/Enrollment.repository.js'

const REQUIRED_STUDENT_FIELDS = ['name', 'documentType', 'documentNumber']
const REQUIRED_GUARDIAN_FIELDS = ['name', 'documentType', 'documentNumber', 'email', 'phone', 'relationship']
const RELATIONSHIPS = ['mother', 'father', 'guardian', 'other']

const requiredText = (object: Record<string, unknown>, fields: string[]) => {
    for (const field of fields) {
        const value = object[field]
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new InvalidFormatError(`El campo ${field} es obligatorio`)
        }
        if (value.trim().length > 160) {
            throw new InvalidFormatError(`El campo ${field} no puede superar 160 caracteres`)
        }
    }
}

const cleanFields = (source: Record<string, unknown>, fields: string[]) => (
    Object.fromEntries(fields.filter(field => source[field] !== undefined)
        .map(field => [field, typeof source[field] === 'string' ? source[field].trim() : source[field]]))
)

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const STORAGE_BUCKET = 'enrollment-documents'
const PASSWORD_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&'
let storageClient: SupabaseClient | null = null

const getStorageClient = () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en el API')
    }
    if (!storageClient) {
        storageClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
        })
    }
    return storageClient
}

@Service()
export class EnrollmentService {
    constructor(
        @Inject(EnrollmentRepository)
        private enrollmentRepository: EnrollmentRepository
    ) { }

    async createDraft(input: Record<string, any>) {
        const { schoolCode, gradePeriodId, student, guardian } = input || {}
        if (typeof schoolCode !== 'string' || !schoolCode.trim()) {
            throw new InvalidFormatError('schoolCode es obligatorio')
        }
        if (typeof gradePeriodId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(gradePeriodId)) {
            throw new InvalidFormatError('gradePeriodId debe ser un UUID válido')
        }
        if (!student || typeof student !== 'object' || Array.isArray(student)) {
            throw new InvalidFormatError('student debe ser un objeto')
        }
        if (!guardian || typeof guardian !== 'object' || Array.isArray(guardian)) {
            throw new InvalidFormatError('guardian debe ser un objeto')
        }

        const studentFields = [
            'name', 'documentType', 'documentNumber', 'gender', 'birthDate',
            'phone', 'address', 'previousSchool', 'shift'
        ]
        const guardianFields = [
            'name', 'documentType', 'documentNumber', 'email', 'phone', 'address',
            'whatsapp', 'relationship', 'isPaymentResponsible',
            'emailNotifications', 'whatsappNotifications'
        ]
        const cleanStudent = cleanFields(student, studentFields)
        const cleanGuardian = cleanFields(guardian, guardianFields)

        requiredText(cleanStudent, REQUIRED_STUDENT_FIELDS)
        requiredText(cleanGuardian, REQUIRED_GUARDIAN_FIELDS)
        for (const [objectName, object, fields] of [
            ['student', cleanStudent, studentFields],
            ['guardian', cleanGuardian, guardianFields]
        ] as const) {
            for (const field of fields) {
                const value = object[field]
                if (value !== undefined && value !== null
                    && !['birthDate', 'isPaymentResponsible', 'emailNotifications', 'whatsappNotifications'].includes(field)
                    && typeof value !== 'string') {
                    throw new InvalidFormatError(`${objectName}.${field} debe ser texto`)
                }
            }
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cleanGuardian.email))) {
            throw new InvalidFormatError('El correo del acudiente no es válido')
        }
        if (typeof cleanStudent.shift !== 'string' || !['morning', 'afternoon'].includes(cleanStudent.shift)) {
            throw new InvalidFormatError('shift debe ser morning o afternoon')
        }
        cleanGuardian.email = String(cleanGuardian.email).toLowerCase()
        if (!RELATIONSHIPS.includes(String(cleanGuardian.relationship))) {
            throw new InvalidFormatError(`relationship debe ser uno de: ${RELATIONSHIPS.join(', ')}`)
        }
        if (cleanStudent.birthDate !== undefined && cleanStudent.birthDate !== null) {
            const date = String(cleanStudent.birthDate)
            const parsedDate = new Date(`${date}T00:00:00Z`)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
                throw new InvalidFormatError('birthDate debe usar el formato YYYY-MM-DD')
            }
            if (parsedDate.getTime() > Date.now()) {
                throw new InvalidFormatError('birthDate no puede ser una fecha futura')
            }
            if (cleanStudent.gender !== undefined && !['F', 'M', 'O'].includes(String(cleanStudent.gender))) {
                throw new InvalidFormatError('gender debe ser F, M u O')
            }
        } else {
            throw new InvalidFormatError('El campo birthDate es obligatorio')
        }
        if (cleanGuardian.isPaymentResponsible !== undefined && typeof cleanGuardian.isPaymentResponsible !== 'boolean') {
            throw new InvalidFormatError('isPaymentResponsible debe ser booleano')
        }
        for (const field of ['emailNotifications', 'whatsappNotifications']) {
            if (typeof cleanGuardian[field] !== 'boolean') {
                throw new InvalidFormatError(`${field} debe ser booleano`)
            }
        }

        const period = await this.enrollmentRepository.findOpenPeriod(schoolCode.trim())
        if (!period) throw new NotFoundError('El colegio no tiene un periodo de matrícula abierto')

        const gradePeriod = await this.enrollmentRepository.findAvailableGradePeriod(
            gradePeriodId,
            period.schoolId,
            period.periodId
        )
        if (!gradePeriod) throw new NotFoundError('El grado no pertenece al periodo abierto de este colegio')
        if (Number(gradePeriod.availableSeats) <= 0) throw new InvalidFormatError('No hay cupos disponibles para el grado seleccionado')

        const accessToken = randomBytes(32).toString('base64url')
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
        const draft = await this.enrollmentRepository.createDraft({
            schoolId: period.schoolId,
            gradePeriodId: gradePeriod.id,
            periodId: period.periodId,
            studentData: cleanStudent,
            guardianData: cleanGuardian,
            accessTokenHash: hashToken(accessToken),
            expiresAt
        })

        return { ...draft, accessToken }
    }

    async createDocumentUpload(draftId: string, accessToken: string, input: Record<string, any>) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draftId)) {
            throw new InvalidFormatError('El identificador del borrador no es válido')
        }
        if (!accessToken) throw new InvalidFormatError('Falta el token de acceso del borrador')

        const { documentTypeId, mimeType, sizeBytes, widthPx, heightPx } = input || {}
        if (typeof documentTypeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentTypeId)) {
            throw new InvalidFormatError('documentTypeId debe ser un UUID válido')
        }
        if (typeof mimeType !== 'string' || !['application/pdf', 'image/jpeg'].includes(mimeType)) {
            throw new InvalidFormatError('Solo se permiten archivos PDF o JPEG')
        }
        if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
            throw new InvalidFormatError('sizeBytes debe ser un entero positivo')
        }

        const tokenHash = hashToken(accessToken)
        const documentType = await this.enrollmentRepository.findDocumentTypeForDraft(draftId, documentTypeId, tokenHash)
        if (!documentType) throw new NotFoundError('El borrador o el requisito documental no existe o expiró')

        this.validateDocumentMetadata(documentType, mimeType, sizeBytes, widthPx, heightPx)
        const extension = mimeType === 'application/pdf' ? 'pdf' : 'jpg'
        const storagePath = `${documentType.schoolId}/${draftId}/${documentTypeId}/${randomBytes(16).toString('hex')}.${extension}`
        const { data, error } = await getStorageClient().storage
            .from(STORAGE_BUCKET)
            .createSignedUploadUrl(storagePath, { upsert: false })
        if (error) throw new Error(`No se pudo preparar la carga del documento: ${error.message}`)
        return { path: storagePath, token: data.token }
    }

    private validateDocumentMetadata(documentType, mimeType: string, sizeBytes: number, widthPx?: number, heightPx?: number) {
        if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
            throw new InvalidFormatError('sizeBytes debe ser un entero positivo')
        }
        const allowedMimeTypes = String(documentType.allowedMimeType)
            .split(/[|,]/).map((type) => type.trim())
        if (!allowedMimeTypes.includes(mimeType)) {
            throw new InvalidFormatError('El formato del archivo no está permitido para este requisito')
        }
        if (sizeBytes > Number(documentType.maxSizeBytes)) {
            throw new InvalidFormatError('El archivo supera el tamaño máximo permitido')
        }
        for (const [dimension, value] of [['widthPx', widthPx], ['heightPx', heightPx]] as const) {
            if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
                throw new InvalidFormatError(`${dimension} debe ser un entero positivo`)
            }
        }
        if (mimeType === 'image/jpeg') {
            if (documentType.minWidthPx && (!widthPx || widthPx < documentType.minWidthPx)) {
                throw new InvalidFormatError('La imagen no cumple el ancho mínimo requerido')
            }
            if (documentType.minHeightPx && (!heightPx || heightPx < documentType.minHeightPx)) {
                throw new InvalidFormatError('La imagen no cumple el alto mínimo requerido')
            }
            if (documentType.maxWidthPx && widthPx && widthPx > documentType.maxWidthPx) {
                throw new InvalidFormatError('La imagen supera el ancho máximo permitido')
            }
            if (documentType.maxHeightPx && heightPx && heightPx > documentType.maxHeightPx) {
                throw new InvalidFormatError('La imagen supera el alto máximo permitido')
            }
        }
    }

    async addDocument(draftId: string, accessToken: string, input: Record<string, any>) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draftId)) {
            throw new InvalidFormatError('El identificador del borrador no es válido')
        }
        if (!accessToken) throw new InvalidFormatError('Falta el token de acceso del borrador')
        const { documentTypeId, path, fileName, mimeType, sizeBytes, widthPx, heightPx } = input || {}
        if (typeof documentTypeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentTypeId)) {
            throw new InvalidFormatError('documentTypeId debe ser un UUID válido')
        }
        if (typeof fileName !== 'string' || fileName.trim().length < 1 || fileName.trim().length > 255 || /[\\/\u0000-\u001f]/.test(fileName)) {
            throw new InvalidFormatError('fileName debe ser un nombre de archivo válido (máximo 255 caracteres)')
        }
        if (typeof mimeType !== 'string' || !['application/pdf', 'image/jpeg'].includes(mimeType)) {
            throw new InvalidFormatError('Solo se permiten archivos PDF o JPEG')
        }
        if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
            throw new InvalidFormatError('sizeBytes debe ser un entero positivo')
        }

        const tokenHash = hashToken(accessToken)
        const documentType = await this.enrollmentRepository.findDocumentTypeForDraft(draftId, documentTypeId, tokenHash)
        if (!documentType) throw new NotFoundError('El borrador o el requisito documental no existe o expiró')
        this.validateDocumentMetadata(documentType, mimeType, sizeBytes, widthPx, heightPx)
        const extension = mimeType === 'application/pdf' ? 'pdf' : 'jpg'
        const expectedPrefix = `${documentType.schoolId}/${draftId}/${documentTypeId}/`
        if (typeof path !== 'string' || !path.startsWith(expectedPrefix)
            || !new RegExp(`^[0-9a-f]{32}\\.${extension}$`, 'i').test(path.slice(expectedPrefix.length))) {
            throw new InvalidFormatError('La ruta del archivo no corresponde a esta solicitud')
        }

        const { data: file, error: downloadError } = await getStorageClient().storage
            .from(STORAGE_BUCKET)
            .download(path)
        if (downloadError || !file) throw new NotFoundError('No se encontró el archivo en el almacenamiento')
        if (file.size !== sizeBytes) throw new InvalidFormatError('El tamaño real del archivo no coincide')
        const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer())
        const isPdf = mimeType === 'application/pdf'
            && new TextDecoder().decode(signature).startsWith('%PDF-')
        const isJpeg = mimeType === 'image/jpeg'
            && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
        if (!isPdf && !isJpeg) throw new InvalidFormatError('El contenido del archivo no coincide con su formato')

        const document = await this.enrollmentRepository.createDraftDocument({
            draftId, schoolId: documentType.schoolId, documentTypeId,
            fileUrl: `supabase://${STORAGE_BUCKET}/${path}`,
            storagePath: path,
            fileName: fileName.trim(), mimeType, sizeBytes, widthPx, heightPx
        }, tokenHash)
        if (!document) throw new NotFoundError('El borrador no existe o expiró')
        return document
    }

    async submitDraft(draftId: string, accessToken: string) {
        if (!accessToken) throw new InvalidFormatError('Falta el token de acceso del borrador')
        const password = `${Array.from(randomBytes(18), byte => PASSWORD_CHARACTERS[byte % PASSWORD_CHARACTERS.length]).join('')}Aa1!`
        const passwordHash = await bcrypt.hash(password, 10)
        const tokenHash = hashToken(accessToken)
        const enrollment = await this.enrollmentRepository.submitDraft(
            draftId,
            tokenHash,
            passwordHash
        )
        if (!enrollment) throw new NotFoundError('El borrador no existe o expiró')
        return { ...enrollment, temporaryPassword: password }
    }
}

export default EnrollmentService
