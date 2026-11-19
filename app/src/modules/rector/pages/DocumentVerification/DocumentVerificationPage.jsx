import { useEffect, useMemo, useState } from 'react'
import Requester from '../../../../core/services/service/Requester.mjs'
import API from '../../../../core/config/api.config.mjs'
import './DocumentVerificationPage.css'

const enrollmentUrl = API.ENROLLMENTS.ENDPOINTS.BASE

const getQueueState = student => {
  if (student.hasCorrections) return 'Corregido'
  if (Number(student.uploadedDocuments) < Number(student.requiredDocuments)) return 'Parcial'
  return 'Nuevo'
}

const statusLabel = status => ({
  approved: 'Aprobado', pending: 'En revisión', rejected: 'Rechazado', missing: 'Pendiente'
}[status] || status || 'Pendiente')

const formatBytes = bytes => {
  const size = Number(bytes || 0)
  if (!size) return ''
  return size < 1024 * 1024 ? `${(size / 1024).toFixed(0)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentVerificationPage() {
  const [students, setStudents] = useState([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [enrollment, setEnrollment] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [search, setSearch] = useState('')
  const [observation, setObservation] = useState('')
  const [modal, setModal] = useState('')
  const [message, setMessage] = useState('')
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueAttempt, setQueueAttempt] = useState(0)
  const [queueError, setQueueError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Requester.get(`${enrollmentUrl}/review-queue`).then(result => {
      if (!active) return
      if (!result.ok) throw new Error(result.message || 'No se pudo cargar la bandeja.')
      const rows = Array.isArray(result.data) ? result.data : []
      setStudents(rows)
      setSelectedEnrollmentId(rows[0]?.enrollmentId || '')
    }).catch(error => {
      if (active) setQueueError(error.message || 'No se pudo cargar la bandeja de documentos.')
    }).finally(() => {
      if (active) setQueueLoading(false)
    })
    return () => { active = false }
  }, [queueAttempt])

  useEffect(() => {
    if (!selectedEnrollmentId) {
      setEnrollment(null)
      setDocuments([])
      setSelectedDocumentId('')
      return undefined
    }
    let active = true
    setDetailLoading(true)
    setDetailError('')
    setDocuments([])
    setSelectedDocumentId('')
    Requester.get(`${enrollmentUrl}/${encodeURIComponent(selectedEnrollmentId)}/documents`).then(result => {
      if (!active) return
      if (!result.ok) throw new Error(result.message || 'No se pudo cargar el expediente.')
      setEnrollment(result.data?.enrollment || null)
      const items = result.data?.documents || []
      setDocuments(items)
      setSelectedDocumentId(items[0]?.documentTypeId || '')
    }).catch(error => {
      if (active) setDetailError(error.message || 'No se pudieron cargar los documentos del expediente.')
    }).finally(() => {
      if (active) setDetailLoading(false)
    })
    return () => { active = false }
  }, [selectedEnrollmentId])

  const selectedStudent = students.find(item => item.enrollmentId === selectedEnrollmentId)
  const selectedDocument = documents.find(item => item.documentTypeId === selectedDocumentId) || null
  const filteredStudents = useMemo(() => students.filter(student => (
    student.studentName?.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
  )), [students, search])

  const confirmReview = async () => {
    if (!selectedDocument?.documentId) return
    setSaving(true)
    setMessage('')
    try {
      const result = await Requester.patch(`${enrollmentUrl}/documents/${selectedDocument.documentId}/review`, {
        decision: modal === 'approve' ? 'approved' : 'rejected',
        ...(modal === 'reject' ? { observation: observation.trim() } : {})
      })
      if (!result.ok) throw new Error(result.message || 'No se pudo guardar la revisión.')
      setDocuments(current => current.map(document => document.documentId === selectedDocument.documentId
        ? { ...document, status: result.data.status, observation: result.data.observation }
        : document))
      setObservation('')
      setModal('')
      setMessage(modal === 'approve' ? 'Documento aprobado.' : 'Rechazo guardado. No se envió ninguna notificación.')
      const queueResult = await Requester.get(`${enrollmentUrl}/review-queue`)
      if (queueResult.ok && Array.isArray(queueResult.data)) {
        setStudents(queueResult.data)
        if (!queueResult.data.some(student => student.enrollmentId === selectedEnrollmentId)) {
          setSelectedEnrollmentId(queueResult.data[0]?.enrollmentId || '')
        }
      }
    } catch (error) {
      setMessage(error.message || 'No se pudo guardar la revisión.')
    } finally {
      setSaving(false)
    }
  }

  const isPdf = selectedDocument?.mimeType === 'application/pdf'
  const canReview = Boolean(selectedDocument?.documentId) && selectedDocument.status !== 'approved'

  return <main className="dv-page">
    <header className="dv-heading">
      <div><h1>Verificación de documentos</h1><p>{students.length} expedientes pendientes · ordenados por antigüedad</p></div>
      <span className="dv-school">{enrollment?.academicYear ? `Periodo ${enrollment.academicYear}` : 'Expedientes del colegio'}</span>
    </header>
    {message && <div className="dv-message" role="status">{message}<button onClick={() => setMessage('')} aria-label="Cerrar">×</button></div>}

    {queueError ? <div className="dv-state dv-state-error" role="alert"><p>{queueError}</p><button onClick={() => { setQueueLoading(true); setQueueError(''); setQueueAttempt(value => value + 1) }}>Reintentar</button></div>
      : queueLoading ? <p className="dv-state" role="status">Cargando expedientes…</p>
        : students.length === 0 ? <div className="dv-state">No hay expedientes pendientes de revisión.</div>
          : <section className="dv-columns">
            <aside className="dv-card dv-students">
              <label className="dv-search"><span aria-hidden="true">⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar estudiante…" /></label>
              <div className="dv-student-list">{filteredStudents.map(student => {
                const state = getQueueState(student)
                return <button key={student.enrollmentId} className={`dv-student ${selectedEnrollmentId === student.enrollmentId ? 'selected' : ''}`} onClick={() => { setSelectedEnrollmentId(student.enrollmentId); setObservation(''); setMessage('') }}>
                  <span className="dv-avatar">{student.studentName?.split(' ').slice(0, 2).map(part => part[0]).join('')}</span>
                  <span className="dv-student-info"><b>{student.studentName}</b><small>{student.grade} · {student.uploadedDocuments} de {student.requiredDocuments} documentos</small></span>
                  <span className={`dv-pill ${state.toLocaleLowerCase('es')}`}>{state}</span>
                </button>
              })}</div>
            </aside>

            <section className="dv-card dv-preview">
              {detailError ? <div className="dv-state dv-state-error" role="alert">{detailError}</div>
                : detailLoading ? <div className="dv-state" role="status">Cargando documentos…</div>
                  : <>
                    <div className="dv-doc-heading"><div><h2>{selectedDocument?.name || 'Selecciona un documento'}</h2><p>{selectedDocument?.fileName || statusLabel(selectedDocument?.status)}</p></div>
                      {selectedDocument?.signedUrl && <a className="dv-download" href={selectedDocument.signedUrl} target="_blank" rel="noreferrer">Descargar</a>}
                    </div>
                    <div className="dv-viewer">{selectedDocument?.signedUrl && isPdf
                      ? <iframe title={`Vista previa de ${selectedDocument.name}`} src={selectedDocument.signedUrl} />
                      : selectedDocument?.signedUrl
                        ? <img src={selectedDocument.signedUrl} alt={`Vista previa de ${selectedDocument.name}`} />
                        : <div className="dv-paper"><span className="dv-file-icon">▤</span><b>{selectedDocument?.documentId ? 'No se pudo generar la vista previa.' : 'Este documento aún no ha sido cargado.'}</b><small>{selectedDocument?.fileName || 'Cuando la familia cargue el archivo, aparecerá aquí.'}</small></div>}
                    </div>
                    <p className="dv-file-meta">{selectedDocument?.fileName}{selectedDocument?.sizeBytes && ` · ${formatBytes(selectedDocument.sizeBytes)}`}</p>
                  </>}
            </section>

            <aside className="dv-card dv-review">
              <h2>Documentos del expediente</h2>
              <p className="dv-for-student">{selectedStudent?.studentName} · {selectedStudent?.grade} · {selectedStudent?.fileNumber}</p>
              {detailError ? <p className="dv-state-error" role="alert">{detailError}</p>
                : detailLoading ? <p className="dv-state" role="status">Cargando…</p>
                  : <ul>{documents.map(document => <li key={document.documentTypeId}>
                    <button onClick={() => setSelectedDocumentId(document.documentTypeId)}>{document.name}</button>
                    <span className={`dv-status ${document.status === 'approved' ? 'aprobado' : document.status === 'pending' ? 'en-revisión' : document.status === 'rejected' ? 'rechazado' : 'pendiente'}`}>{statusLabel(document.status)}</span>
                  </li>)}</ul>}
              <label className="dv-observation">Observación para el acudiente<textarea value={observation} onChange={event => setObservation(event.target.value)} placeholder="Escribe el motivo si rechazas el documento…" /></label>
              <button className="dv-approve" disabled={!canReview || saving} onClick={() => { setMessage(''); setModal('approve') }}>Aprobar documento</button>
              <button className="dv-reject" disabled={!canReview || saving} onClick={() => { setMessage(''); setModal('reject') }}>Rechazar con observación</button>
            </aside>
          </section>}

    {modal && selectedDocument && <div className="dv-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setModal('') }}>
      <section className="dv-modal" role="dialog" aria-modal="true" aria-labelledby="dv-modal-title">
        <span className={`dv-modal-icon ${modal}`}>{modal === 'approve' ? '✓' : '!'}</span>
        <h2 id="dv-modal-title">{modal === 'approve' ? 'Aprobar documento' : 'Rechazar con observación'}</h2>
        <p>{modal === 'approve' ? `El documento ${selectedDocument.name} de ${enrollment?.studentName} se marcará como aprobado.` : 'Indica qué debe corregir la familia. No se enviará una notificación.'}</p>
        {modal === 'reject' && <label className="dv-modal-observation">Observación para el acudiente<textarea value={observation} onChange={event => setObservation(event.target.value)} placeholder="Escribe el motivo del rechazo…" /></label>}
        <footer><button className="dv-reject" disabled={saving} onClick={() => setModal('')}>Cancelar</button><button className={modal === 'approve' ? 'dv-approve' : 'dv-confirm-reject'} disabled={saving || (modal === 'reject' && !observation.trim())} onClick={confirmReview}>{saving ? 'Guardando…' : modal === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}</button></footer>
      </section>
    </div>}
  </main>
}
