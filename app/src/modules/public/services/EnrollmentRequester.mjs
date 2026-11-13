import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

let storageClientPromise

const getStorageClient = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
        throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para cargar documentos')
    }
    storageClientPromise ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
    }))
    return storageClientPromise
}

class EnrollmentRequester {
    static async createDraft(data) {
        const result = await Requester.post(`${API.ENROLLMENTS.BASE}/`, data, { useAuth: false })
        if (!result.ok) throw new Error(result.message || 'No se pudo iniciar la matrícula')
        return result.data
    }

    static async addDocument(draftId, accessToken, data) {
        const url = `${API.ENROLLMENTS.BASE}/${encodeURIComponent(draftId)}/documents`
        const result = await Requester.post(url, data, {
            headers: { 'x-enrollment-token': accessToken },
            useAuth: false
        })
        if (!result.ok) throw new Error(result.message || 'No se pudo guardar el documento')
        return result.data
    }

    static async uploadDocument(draft, document, file, dimensions = {}) {
        const headers = { 'x-enrollment-token': draft.accessToken }
        const baseUrl = `${API.ENROLLMENTS.BASE}/${encodeURIComponent(draft.id)}`
        const uploadResult = await Requester.post(`${baseUrl}/documents/upload-url`, {
            documentTypeId: document.id,
            mimeType: file.type,
            sizeBytes: file.size,
            ...dimensions
        }, { headers, useAuth: false })
        if (!uploadResult.ok) throw new Error(uploadResult.message || 'No se pudo preparar la carga del documento')

        const { path, token } = uploadResult.data
        const client = await getStorageClient()
        const { error } = await client.storage
            .from('enrollment-documents')
            .uploadToSignedUrl(path, token, file, {
                contentType: file.type,
                upsert: false
            })
        if (error) throw new Error(`No se pudo cargar ${file.name}: ${error.message}`)

        return EnrollmentRequester.addDocument(draft.id, draft.accessToken, {
            documentTypeId: document.id,
            path,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            ...dimensions
        })
    }

    static async submitDraft(draftId, accessToken) {
        const url = `${API.ENROLLMENTS.BASE}/${encodeURIComponent(draftId)}/submit`
        const result = await Requester.post(url, {}, {
            headers: { 'x-enrollment-token': accessToken },
            useAuth: false
        })
        if (!result.ok) throw new Error(result.message || 'No se pudo enviar la matrícula')
        return result.data
    }
}

export default EnrollmentRequester
