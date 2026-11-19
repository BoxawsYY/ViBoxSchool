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
    if (item.hasRejections) return { label: 'Con observaciones', tone: 'red' }
    if (!item.requiredDocuments) return { label: 'Sin requisitos', tone: 'muted' }
    if (item.uploadedDocuments >= item.requiredDocuments && !item.hasPending) return { label: 'Verificados', tone: 'green' }
    if (item.uploadedDocuments === 0) return { label: 'Sin documentos', tone: 'amber' }
    if (item.hasPending) return { label: 'Por verificar', tone: 'amber' }
    return { label: `${item.uploadedDocuments}/${item.requiredDocuments} cargados`, tone: 'amber' }
}

const deriveStatePill = (item) => {
    if (item.hasRejections) return { label: 'Documentos incompletos', tone: 'red' }
    if (item.hasPending) return { label: 'En revisión', tone: 'blue' }
    return { label: 'Pendiente de pago', tone: 'amber' }
}

const statusLabel = (status) => ({
    approved: 'Aprobado',
    rejected: 'Rechazado',
    pending: 'En revisión',
    missing: 'Falta cargar'
}[status] || status)

const RELATIONSHIPS = [
    { value: 'mother', label: 'Madre' },
    { value: 'father', label: 'Padre' },
    { value: 'guardian', label: 'Acudiente' },
    { value: 'other', label: 'Otro' }
]

const dateInputValue = (value) => (typeof value === 'string' ? value.slice(0, 10) : '')

const statusTone = (status) => ({
    approved: 'green',
    rejected: 'red',
    pending: 'amber',
    missing: 'red'
}[status] || 'muted')

const exportSpreadsheet = (rows) => {
    const headers = ['Expediente', 'Estudiante', 'Grado', 'Acudiente', 'Documentos', 'Pago matrícula', 'Estado']
    const body = rows.map((item) => [
        item.fileNumber || '',
        item.studentName || '',
        item.grade || '',
        item.guardianName || '',
        deriveDocumentPill(item).label,
        'Pendiente',
        deriveStatePill(item).label
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
    const [payFilter, setPayFilter] = useState('all')
    const [page, setPage] = useState(0)
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState('')
    const [editMode, setEditMode] = useState(false)
    const [form, setForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

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
            || String(item.studentDocumentNumber || '').toLocaleLowerCase('es').includes(normalized)
        const matchGrade = gradeFilter === 'all' || item.grade === gradeFilter
        const matchState = stateFilter === 'all' || deriveStatePill(item).label === stateFilter
        const matchPay = payFilter === 'all' || payFilter === 'pending'
        return matchSearch && matchGrade && matchState && matchPay
    })
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages - 1)
    const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
    const from = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1
    const to = Math.min(filtered.length, currentPage * PAGE_SIZE + PAGE_SIZE)

    const openDetail = async (item, mode = 'view') => {
        setEditMode(mode === 'edit')
        setForm(null)
        setSaveError('')
        setDetailLoading(true)
        setDetailError('')
        setDetail({ summary: item })
        try {
            const data = await EnrollmentsRequester.detail(item.enrollmentId)
            setDetail({ summary: item, ...data })
            if (mode === 'edit' && !data.locked && data.student && data.guardian) {
                setForm({
                    student: {
                        name: data.student.name ?? '',
                        documentType: data.student.documentType ?? '',
                        documentNumber: data.student.documentNumber ?? '',
                        gender: data.student.gender ?? '',
                        birthDate: dateInputValue(data.student.birthDate),
                        phone: data.student.phone ?? '',
                        address: data.student.address ?? '',
                        previousSchool: data.student.previousSchool ?? '',
                        shift: data.student.shift ?? 'morning'
                    },
                    guardian: {
                        name: data.guardian.name ?? '',
                        documentType: data.guardian.documentType ?? '',
                        documentNumber: data.guardian.documentNumber ?? '',
                        email: data.guardian.email ?? '',
                        phone: data.guardian.phone ?? '',
                        whatsapp: data.guardian.whatsapp ?? '',
                        address: data.guardian.address ?? '',
                        relationship: data.guardian.relationship ?? 'other',
                        isPaymentResponsible: data.guardian.isPaymentResponsible ?? false,
                        emailNotifications: data.guardian.emailNotifications ?? false,
                        whatsappNotifications: data.guardian.whatsappNotifications ?? false
                    }
                })
            }
        } catch (requestError) {
            setDetailError(requestError.message || 'No se pudo cargar el expediente')
        } finally {
            setDetailLoading(false)
        }
    }

    const updateField = (section, field) => (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value
        setForm((current) => ({ ...current, [section]: { ...current[section], [field]: value } }))
    }

    const closeDetail = () => {
        setDetail(null)
        setEditMode(false)
        setForm(null)
    }

    const saveForm = async () => {
        if (!form || !detail) return
        setSaving(true)
        setSaveError('')
        const compact = (object) => Object.fromEntries(
            Object.entries(object).filter(([, value]) => (
                typeof value === 'boolean' ? true : String(value ?? '').trim() !== ''
            ))
        )
        try {
            await EnrollmentsRequester.update(detail.summary.enrollmentId, {
                student: compact(form.student),
                guardian: compact(form.guardian)
            })
            const item = detail.summary
            setNotice('Cambios guardados y registrados.')
            await openDetail(item, 'view')
            loadQueue()
        } catch (requestError) {
            setSaveError(requestError.message || 'No se pudieron guardar los cambios')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className='se-page'>
            <header className='se-header'>
                <div className='se-title-block'>
                    <h1>Gestión de matrículas</h1>
                    <p className='se-subtitle'>{queue.length} expedientes · Año lectivo vigente</p>
                </div>
                <div className='se-actions'>
                    <button type='button' className='se-btn se-btn-outline' onClick={() => exportSpreadsheet(filtered)} disabled={filtered.length === 0}>
                        Exportar Excel
                    </button>
                    <button type='button' className='se-btn se-btn-primary' onClick={() => setShowWizard(true)} disabled={!schoolCode}>
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
                        placeholder='Buscar por nombre, documento o expediente…'
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
                        <option value='Pendiente de pago'>Pendiente de pago</option>
                        <option value='En revisión'>En revisión</option>
                        <option value='Documentos incompletos'>Documentos incompletos</option>
                    </select>
                </label>
                <label className='se-filter'>
                    <select value={payFilter} onChange={(event) => { setPayFilter(event.target.value); setPage(0) }} aria-label='Filtrar por pago'>
                        <option value='all'>Pago: Todos</option>
                        <option value='pending'>Pendiente</option>
                        <option value='paid'>Pagada</option>
                    </select>
                </label>
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
                                            <th scope='col'>Acudiente</th>
                                            <th scope='col'>Documentos</th>
                                            <th scope='col'>Pago matrícula</th>
                                            <th scope='col'>Estado</th>
                                            <th scope='col'>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((item) => {
                                            const docPill = deriveDocumentPill(item)
                                            const statePill = deriveStatePill(item)
                                            return (
                                                <tr key={item.enrollmentId}>
                                                    <td>{item.fileNumber}</td>
                                                    <td>
                                                        <strong className='se-student'>{item.studentName}</strong>
                                                        <small className='se-student-doc'>{item.studentDocumentType ? `${item.studentDocumentType} · ${item.studentDocumentNumber}` : 'Documento sin registro'}</small>
                                                    </td>
                                                    <td>{item.grade}</td>
                                                    <td>{item.guardianName || '—'}</td>
                                                    <td><span className={`se-pill se-pill-${docPill.tone}`}>{docPill.label}</span></td>
                                                    <td><span className='se-pill se-pill-amber'>Pendiente</span></td>
                                                    <td><span className={`se-pill se-pill-${statePill.tone}`}>{statePill.label}</span></td>
                                                    <td>
                                                        <div className='se-action-buttons'>
                                                            <button type='button' className='se-icon-btn' aria-label={`Ver expediente ${item.fileNumber}`} onClick={() => openDetail(item, 'view')}>
                                                                <span className='material-symbols-rounded' aria-hidden='true'>visibility</span>
                                                            </button>
                                                            <button type='button' className='se-icon-btn' aria-label={`Editar datos de ${item.fileNumber}`} onClick={() => openDetail(item, 'edit')}>
                                                                <span className='material-symbols-rounded' aria-hidden='true'>edit</span>
                                                            </button>
                                                        </div>
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
                                    <button type='button' className='se-btn' onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0}>Anterior</button>
                                    <button type='button' className='se-btn' onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={currentPage >= totalPages - 1}>Siguiente</button>
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
                <Modal size='large' position='center' title={`Expediente ${detail.summary?.fileNumber || ''}`} onClose={closeDetail} show>
                    <div className='se-detail'>
                        <p className='se-detail-title'>{detail.summary?.studentName} · {detail.summary?.grade}</p>
                        <p className='se-detail-meta'>Solicitada: {formatDate(detail.summary?.requestedAt)} · Documentos cargados: {detail.summary?.uploadedDocuments}/{detail.summary?.requiredDocuments}</p>
                        {detail?.locked && (
                            <p className='se-locked' role='status'>
                                Expediente verificado: todos los documentos están aprobados. Solo lectura.
                            </p>
                        )}
                        {detailLoading ? <p className='se-state' role='status'>Cargando…</p>
                            : detailError ? <p className='se-error' role='alert'>{detailError}</p>
                            : editMode ? (
                                <form className='se-form' onSubmit={(event) => { event.preventDefault(); saveForm() }}>
                                    <p className='se-form-heading'><span className='material-symbols-rounded' aria-hidden='true'>person</span>Datos del estudiante</p>
                                    <div className='se-form-grid'>
                                        <label className='se-field se-field-full'><span>Nombre</span><input type='text' value={form.student.name} onChange={updateField('student', 'name')} required /></label>
                                        <label className='se-field'><span>Tipo doc.</span><select value={form.student.documentType} onChange={updateField('student', 'documentType')}><option value='RC'>RC</option><option value='TI'>T.I.</option><option value='CC'>C.C.</option><option value='CE'>C.E.</option><option value='PA'>Pasaporte</option></select></label>
                                        <label className='se-field'><span>Número de documento</span><input type='text' value={form.student.documentNumber} onChange={updateField('student', 'documentNumber')} /></label>
                                        <label className='se-field'><span>Género</span><select value={form.student.gender} onChange={updateField('student', 'gender')}><option value=''>—</option><option value='F'>F</option><option value='M'>M</option><option value='O'>Otro</option></select></label>
                                        <label className='se-field'><span>Fecha nacimiento</span><input type='date' value={form.student.birthDate} onChange={updateField('student', 'birthDate')} /></label>
                                        <label className='se-field'><span>Teléfono</span><input type='text' value={form.student.phone} onChange={updateField('student', 'phone')} /></label>
                                        <label className='se-field'><span>Turno</span><select value={form.student.shift} onChange={updateField('student', 'shift')}><option value='morning'>Mañana</option><option value='afternoon'>Tarde</option></select></label>
                                        <label className='se-field se-field-full'><span>Dirección</span><input type='text' value={form.student.address} onChange={updateField('student', 'address')} /></label>
                                        <label className='se-field se-field-full'><span>Colegio anterior</span><input type='text' value={form.student.previousSchool} onChange={updateField('student', 'previousSchool')} /></label>
                                    </div>

                                    <p className='se-form-heading'><span className='material-symbols-rounded' aria-hidden='true'>diversity_2</span>Datos del acudiente</p>
                                    <div className='se-form-grid'>
                                        <label className='se-field se-field-full'><span>Nombre</span><input type='text' value={form.guardian.name} onChange={updateField('guardian', 'name')} required /></label>
                                        <label className='se-field'><span>Tipo doc.</span><select value={form.guardian.documentType} onChange={updateField('guardian', 'documentType')}><option value='CC'>C.C.</option><option value='TI'>T.I.</option><option value='CE'>C.E.</option><option value='PA'>Pasaporte</option></select></label>
                                        <label className='se-field'><span>Número de documento</span><input type='text' value={form.guardian.documentNumber} onChange={updateField('guardian', 'documentNumber')} /></label>
                                        <label className='se-field'><span>Correo</span><input type='email' value={form.guardian.email} onChange={updateField('guardian', 'email')} /></label>
                                        <label className='se-field'><span>Teléfono</span><input type='text' value={form.guardian.phone} onChange={updateField('guardian', 'phone')} /></label>
                                        <label className='se-field'><span>WhatsApp</span><input type='text' value={form.guardian.whatsapp} onChange={updateField('guardian', 'whatsapp')} /></label>
                                        <label className='se-field se-field-full'><span>Dirección</span><input type='text' value={form.guardian.address} onChange={updateField('guardian', 'address')} /></label>
                                        <label className='se-field'><span>Parentesco</span><select value={form.guardian.relationship} onChange={updateField('guardian', 'relationship')}>{RELATIONSHIPS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                        <label className='se-field'><span>Responsable de pago</span><select value={String(form.guardian.isPaymentResponsible)} onChange={(event) => setForm((current) => ({ ...current, guardian: { ...current.guardian, isPaymentResponsible: event.target.value === 'true' } }))}><option value='true'>Sí</option><option value='false'>No</option></select></label>
                                        <label className='se-field se-check'><span>Notificaciones por correo</span><input type='checkbox' checked={Boolean(form.guardian.emailNotifications)} onChange={updateField('guardian', 'emailNotifications')} /></label>
                                        <label className='se-field se-check'><span>Notificaciones por WhatsApp</span><input type='checkbox' checked={Boolean(form.guardian.whatsappNotifications)} onChange={updateField('guardian', 'whatsappNotifications')} /></label>
                                    </div>

                                    {saveError && <p className='se-error' role='alert'>{saveError}</p>}
                                    <div className='se-form-actions'>
                                        <button type='button' className='se-btn se-btn-ghost' onClick={() => setEditMode(false)} disabled={saving}>Cancelar</button>
                                        <button type='submit' className='se-btn se-btn-primary' disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                                    </div>
                                </form>
                            ) : (
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
                        {!editMode && !detail?.locked && (
                            <div className='se-form-actions'>
                                <button type='button' className='se-btn se-btn-primary' onClick={() => openDetail(detail.summary, 'edit')}>Editar datos</button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </section>
    )
}

export default SecretaryEnrollmentsPage
