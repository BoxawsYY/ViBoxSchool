import './SecretaryEnrollmentsPage.css'
import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../../core/components/Modal/Modal'
import { useAuth } from '../../../../core/contexts/AuthContext'
import EnrollmentsRequester from '../../services/EnrollmentsRequester.mjs'
import EnrollmentWizardContent from '../../../public/pages/EnrollmentWizard/EnrollmentWizardContent'

const PAGE_SIZE = 10

const formatDate = (value) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const deriveDocumentPill = (item) => {
    if (!item.requiredDocuments) return { label: 'Sin requisitos', tone: 'muted' }
    if (item.uploadedDocuments >= item.requiredDocuments) return { label: 'Por verificar', tone: 'amber' }
    if (item.uploadedDocuments === 0) return { label: 'Sin documentos', tone: 'red' }
    return { label: `${item.uploadedDocuments}/${item.requiredDocuments} cargados`, tone: 'amber' }
}

const deriveStatePill = (item) => {
    if (!item.requiredDocuments) return { label: 'En revisión', tone: 'blue' }
    if (item.uploadedDocuments >= item.requiredDocuments) return { label: 'En revisión', tone: 'blue' }
    return { label: 'Documentos incompletos', tone: 'red' }
}

const statusLabel = (status) => ({
    approved: 'Aprobado',
    rejected: 'Rechazado',
    pending: 'En revisión',
    missing: 'Falta cargar'
}[status] || status)

const statusTone = (status) => ({
    approved: 'green',
    rejected: 'red',
    pending: 'amber',
    missing: 'red'
}[status] || 'muted')

const exportSpreadsheet = (rows) => {
    const headers = ['Expediente', 'Estudiante', 'Grado', 'Documentos', 'Estado', 'Solicitada']
    const body = rows.map((item) => [
        item.fileNumber || '',
        item.studentName || '',
        item.grade || '',
        `${item.uploadedDocuments ?? 0}/${item.requiredDocuments ?? 0}`,
        deriveStatePill(item).label,
        formatDate(item.requestedAt)
    ])
    const cell = (value) => `<Cell><Data ss:Type="String">${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`
    const sheet = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Matrículas">
    <Table>
      <Row>${headers.map(cell).join('')}</Row>
      ${body.map((row) => `<Row>${row.map(cell).join('')}</Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`
    const blob = new Blob([sheet], { type: 'application/vnd.ms-excel' })
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = 'gestion-matriculas.xls'
    anchor.click()
    URL.revokeObjectURL(anchor.href)
}

const SecretaryEnrollmentsPage = () => {
    const { user } = useAuth()
    const schoolCode = user?.school?.code || null
    const [queue, setQueue] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [showWizard, setShowWizard] = useState(false)
    const [search, setSearch] = useState('')
    const [gradeFilter, setGradeFilter] = useState('all')
    const [stateFilter, setStateFilter] = useState('all')
    const [page, setPage] = useState(0)
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState('')

    const loadQueue = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const data = await EnrollmentsRequester.reviewQueue()
            setQueue(Array.isArray(data) ? data : [])
        } catch (requestError) {
            setError(requestError.message || 'No se pudieron cargar los expedientes pendientes')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadQueue()
    }, [loadQueue])

    const handleEnrollmentSuccess = () => {
        setNotice('Matrícula enviada. El expediente quedó en verificación de documentos.')
        loadQueue()
    }

    const closeWizard = () => {
        setShowWizard(false)
        loadQueue()
    }

    const grades = [...new Set(queue.map((item) => item.grade).filter(Boolean))]
    const normalized = search.trim().toLocaleLowerCase('es')
    const filtered = queue.filter((item) => {
        const matchSearch = !normalized
            || String(item.studentName || '').toLocaleLowerCase('es').includes(normalized)
            || String(item.fileNumber || '').toLocaleLowerCase('es').includes(normalized)
        const matchGrade = gradeFilter === 'all' || item.grade === gradeFilter
        const matchState = stateFilter === 'all' || deriveStatePill(item).tone === (stateFilter === 'incomplete' ? 'red' : 'blue')
        return matchSearch && matchGrade && matchState
    })
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages - 1)
    const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
    const from = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1
    const to = Math.min(filtered.length, currentPage * PAGE_SIZE + PAGE_SIZE)

    const openDetail = async (item) => {
        setDetailLoading(true)
        setDetailError('')
        setDetail({ summary: item })
        try {
            const data = await EnrollmentsRequester.detail(item.enrollmentId)
            setDetail({ summary: item, ...data })
        } catch (requestError) {
            setDetailError(requestError.message || 'No se pudo cargar el expediente')
        } finally {
            setDetailLoading(false)
        }
    }

    return (
        <section className='se-page'>
            <header className='se-header'>
                <div className='se-title-block'>
                    <span className='se-eyebrow'>GESTIÓN DE MATRÍCULAS</span>
                    <h1>Matrículas</h1>
                    <p className='se-subtitle'>{queue.length} expedientes · Año lectivo vigente</p>
                </div>
                <div className='se-actions'>
                    <button type='button' className='se-btn se-btn-ghost' onClick={() => exportSpreadsheet(filtered)} disabled={filtered.length === 0}>
                        <span className='material-symbols-rounded' aria-hidden='true'>download</span>
                        Exportar Excel
                    </button>
                    <button type='button' className='se-btn se-btn-primary' onClick={() => setShowWizard(true)} disabled={!schoolCode}>
                        <span className='material-symbols-rounded' aria-hidden='true'>add_circle</span>
                        Nueva matrícula
                    </button>
                </div>
            </header>

            {notice && <p className='se-notice' role='status'>{notice}</p>}
            {!schoolCode && (
                <p className='se-error' role='alert'>
                    Tu usuario no tiene un colegio asociado, por eso no se puede crear ni listar matrículas. Pide a Rectoría/Administrador que te asigne el colegio.
                </p>
            )}

            <div className='se-filters'>
                <label className='se-search'>
                    <span className='material-symbols-rounded' aria-hidden='true'>search</span>
                    <input
                        type='text'
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); setPage(0) }}
                        placeholder='Buscar por nombre o expediente…'
                        aria-label='Buscar expediente'
                    />
                </label>
                <label className='se-filter'>
                    <select value={gradeFilter} onChange={(event) => { setGradeFilter(event.target.value); setPage(0) }} aria-label='Filtrar por grado'>
                        <option value='all'>Grado: Todos</option>
                        {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                </label>
                <label className='se-filter'>
                    <select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(0) }} aria-label='Filtrar por estado'>
                        <option value='all'>Estado: Todos</option>
                        <option value='review'>En revisión</option>
                        <option value='incomplete'>Documentos incompletos</option>
                    </select>
                </label>
                <button type='button' className='se-btn se-btn-ghost se-btn-small' onClick={loadQueue} disabled={loading}>
                    {loading ? 'Cargando…' : 'Actualizar'}
                </button>
            </div>

            <section className='se-card'>
                {error ? <p className='se-error' role='alert'>{error}</p>
                    : loading ? <p className='se-state' role='status'>Cargando expedientes…</p>
                    : visible.length === 0 ? <p className='se-state'>{queue.length === 0 ? 'No hay expedientes pendientes de verificación en este momento.' : 'Nada coincide con la búsqueda o los filtros.'}</p>
                    : (
                        <>
                            <div className='se-table-wrap'>
                                <table className='se-table'>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Expediente</th>
                                            <th scope='col'>Estudiante</th>
                                            <th scope='col'>Grado</th>
                                            <th scope='col'>Documentos</th>
                                            <th scope='col'>Estado</th>
                                            <th scope='col'>Solicitada</th>
                                            <th scope='col'>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((item) => {
                                            const docPill = deriveDocumentPill(item)
                                            const statePill = deriveStatePill(item)
                                            return (
                                                <tr key={item.enrollmentId}>
                                                    <td><strong>{item.fileNumber}</strong></td>
                                                    <td>{item.studentName}</td>
                                                    <td>{item.grade}</td>
                                                    <td><span className={`se-pill se-pill-${docPill.tone}`}>{docPill.label}</span></td>
                                                    <td><span className={`se-pill se-pill-${statePill.tone}`}>{statePill.label}</span></td>
                                                    <td>{formatDate(item.requestedAt)}</td>
                                                    <td>
                                                        <button type='button' className='se-icon-btn' aria-label={`Ver expediente ${item.fileNumber}`} onClick={() => openDetail(item)}>
                                                            <span className='material-symbols-rounded' aria-hidden='true'>visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className='se-card-footer'>
                                <span>Mostrando {from}–{to} de {filtered.length}</span>
                                <div className='se-pagination'>
                                    <button type='button' className='se-btn se-btn-ghost se-btn-small' onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0}>Anterior</button>
                                    <button type='button' className='se-btn se-btn-ghost se-btn-small' onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={currentPage >= totalPages - 1}>Siguiente</button>
                                </div>
                            </div>
                        </>
                    )}
            </section>

            {showWizard && (
                <Modal size='max' position='center' title='Nueva matrícula' onClose={closeWizard} show>
                    <EnrollmentWizardContent
                        schoolCode={schoolCode}
                        embedded
                        onSuccess={handleEnrollmentSuccess}
                        onClose={closeWizard}
                    />
                </Modal>
            )}

            {detail && (
                <Modal size='large' position='center' title={`Expediente ${detail.summary?.fileNumber || ''}`} onClose={() => setDetail(null)} show>
                    <div className='se-detail'>
                        <p className='se-detail-title'>{detail.summary?.studentName} · {detail.summary?.grade}</p>
                        <p className='se-detail-meta'>Solicitada: {formatDate(detail.summary?.requestedAt)} · Documentos cargados: {detail.summary?.uploadedDocuments}/{detail.summary?.requiredDocuments}</p>
                        {detailLoading ? <p className='se-state' role='status'>Cargando documentos…</p>
                            : detailError ? <p className='se-error' role='alert'>{detailError}</p>
                            : (
                                <ul className='se-doc-list'>
                                    {(detail.documents || []).map((document) => (
                                        <li key={document.documentTypeId} className='se-doc-item'>
                                            <div>
                                                <strong>{document.name}</strong>
                                                <small>{document.fileName ? `${document.fileName} · ` : ''}versión {document.version || 1}</small>
                                                {document.observation && <em>“{document.observation}”</em>}
                                            </div>
                                            <span className={`se-pill se-pill-${statusTone(document.status)}`}>{statusLabel(document.status)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                    </div>
                </Modal>
            )}
        </section>
    )
}

export default SecretaryEnrollmentsPage
