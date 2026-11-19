import './SecretaryEnrollmentsPage.css'
import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../../core/components/Modal/Modal'
import { useAuth } from '../../../../core/contexts/AuthContext'
import EnrollmentsRequester from '../../services/EnrollmentsRequester.mjs'
import EnrollmentWizardContent from '../../../public/pages/EnrollmentWizard/EnrollmentWizardContent'
import Input from '../../../../core/components/Input/Input'
import Select from '../../../../core/components/Select/Select'
import InputGroup from '../../../../core/components/InputGroup/InputGroup'
import Switch from '../../../../core/components/Switch/Switch'
import Button from '../../../../core/components/Button/Button'

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

const STUDENT_DOCUMENT_TYPES = [
    { value: 'RC', key: 'Registro civil' },
    { value: 'TI', key: 'Tarjeta de identidad' },
    { value: 'CC', key: 'Cédula de ciudadanía' },
    { value: 'CE', key: 'Cédula de extranjería' },
    { value: 'PA', key: 'Pasaporte' },
    { value: 'PPT', key: 'PPT' }
]

const GUARDIAN_DOCUMENT_TYPES = [
    { value: 'CC', key: 'Cédula de ciudadanía' },
    { value: 'CE', key: 'Cédula de extranjería' },
    { value: 'TI', key: 'Tarjeta de identidad' },
    { value: 'PA', key: 'Pasaporte' },
    { value: 'PPT', key: 'PPT' }
]

const GENDERS = [
    { value: 'F', key: 'Femenino' },
    { value: 'M', key: 'Masculino' },
    { value: 'O', key: 'Otro' }
]

const SHIFTS = [
    { value: 'morning', key: 'Mañana' },
    { value: 'afternoon', key: 'Tarde' }
]

const BOOLEAN_OPTIONS = [
    { value: 'true', key: 'Sí' },
    { value: 'false', key: 'No' }
]

const FORM_RELATIONSHIPS = [
    { value: 'mother', key: 'Madre' },
    { value: 'father', key: 'Padre' },
    { value: 'guardian', key: 'Acudiente' },
    { value: 'other', key: 'Otro' }
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

    const setPaymentResponsible = (event) => {
        const isPaymentResponsible = event.target.value === 'true'
        setForm((current) => ({ ...current, guardian: { ...current.guardian, isPaymentResponsible } }))
    }

    const toggleNotifications = (field) => async () => {
        setForm((current) => ({ ...current, guardian: { ...current.guardian, [field]: !current.guardian?.[field] } }))
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
                        <div className='se-detail-head'>
                            <div className='se-detail-icon'><span className='material-symbols-rounded' aria-hidden='true'>folder_managed</span></div>
                            <div className='se-detail-headline'>
                                <p className='se-detail-eyebrow'>Expediente de matrícula</p>
                                <p className='se-detail-title'>{detail.summary?.studentName} · {detail.summary?.grade}</p>
                                <p className='se-detail-meta'>
                                    <span><span className='material-symbols-rounded' aria-hidden='true'>calendar_today</span>Solicitada: {formatDate(detail.summary?.requestedAt)}</span>
                                    <span><span className='material-symbols-rounded' aria-hidden='true'>task</span>Documentos cargados: {detail.summary?.uploadedDocuments}/{detail.summary?.requiredDocuments}</span>
                                </p>
                            </div>
                        </div>
                        {detail?.locked && (
                            <p className='se-locked' role='status'>
                                Expediente verificado: todos los documentos están aprobados. Solo lectura.
                            </p>
                        )}
                        {detailLoading ? <p className='se-state' role='status'>Cargando…</p>
                            : detailError ? <p className='se-error' role='alert'>{detailError}</p>
                            : editMode ? (
                                <form className='se-edit-form' onSubmit={(event) => { event.preventDefault(); saveForm() }}>
                                    <div className='se-form-section'>
                                        <p className='se-form-heading'>Datos del estudiante</p>
                                        <InputGroup columns={2}>
                                        <div className='se-field-full'>
                                            <Input id='student-name' name='name' label='Nombre completo' value={form.student.name} onChange={updateField('student', 'name')} required maxLength='160' autoComplete='name' />
                                        </div>
                                        <Select id='student-documentType' name='documentType' label='Tipo de documento' value={form.student.documentType} onChange={updateField('student', 'documentType')} options={STUDENT_DOCUMENT_TYPES} />
                                        <Input id='student-documentNumber' name='documentNumber' label='Número de documento' value={form.student.documentNumber} onChange={updateField('student', 'documentNumber')} inputMode='numeric' maxLength='20' />
                                        <Select id='student-gender' name='gender' label='Género' value={form.student.gender} onChange={updateField('student', 'gender')} options={GENDERS} />
                                        <Input id='student-birthDate' name='birthDate' type='date' label='Fecha de nacimiento' value={form.student.birthDate} onChange={updateField('student', 'birthDate')} />
                                        <Input id='student-phone' name='phone' label='Teléfono de contacto' value={form.student.phone} onChange={updateField('student', 'phone')} inputMode='tel' maxLength='20' />
                                        <Select id='student-shift' name='shift' label='Jornada' value={form.student.shift} onChange={updateField('student', 'shift')} options={SHIFTS} />
                                        <div className='se-field-full'>
                                            <Input id='student-address' name='address' label='Dirección de residencia' value={form.student.address} onChange={updateField('student', 'address')} maxLength='200' autoComplete='street-address' />
                                        </div>
                                        <div className='se-field-full'>
                                            <Input id='student-previousSchool' name='previousSchool' label='Colegio anterior' value={form.student.previousSchool} onChange={updateField('student', 'previousSchool')} maxLength='160' />
                                        </div>
                                        </InputGroup>
                                    </div>

                                    <div className='se-form-section'>
                                        <p className='se-form-heading'>Datos del acudiente</p>
                                    <InputGroup columns={2}>
                                        <div className='se-field-full'>
                                            <Input id='guardian-name' name='name' label='Nombre completo' value={form.guardian.name} onChange={updateField('guardian', 'name')} required maxLength='160' autoComplete='name' />
                                        </div>
                                        <Select id='guardian-documentType' name='documentType' label='Tipo de documento' value={form.guardian.documentType} onChange={updateField('guardian', 'documentType')} options={GUARDIAN_DOCUMENT_TYPES} />
                                        <Input id='guardian-documentNumber' name='documentNumber' label='Número de documento' value={form.guardian.documentNumber} onChange={updateField('guardian', 'documentNumber')} inputMode='numeric' maxLength='20' />
                                        <Input id='guardian-email' name='email' type='email' label='Correo electrónico' value={form.guardian.email} onChange={updateField('guardian', 'email')} autoComplete='email' maxLength='160' />
                                        <Input id='guardian-phone' name='phone' label='Teléfono de contacto' value={form.guardian.phone} onChange={updateField('guardian', 'phone')} inputMode='tel' maxLength='20' />
                                        <Input id='guardian-whatsapp' name='whatsapp' label='WhatsApp' value={form.guardian.whatsapp} onChange={updateField('guardian', 'whatsapp')} inputMode='tel' maxLength='20' />
                                        <Select id='guardian-relationship' name='relationship' label='Parentesco' value={form.guardian.relationship} onChange={updateField('guardian', 'relationship')} options={FORM_RELATIONSHIPS} />
                                        <Select id='guardian-isPaymentResponsible' name='isPaymentResponsible' label='Responsable de pago' value={String(form.guardian.isPaymentResponsible)} onChange={setPaymentResponsible} options={BOOLEAN_OPTIONS} />
                                        <div className='se-field-full'>
                                            <Input id='guardian-address' name='address' label='Dirección de residencia' value={form.guardian.address} onChange={updateField('guardian', 'address')} maxLength='200' autoComplete='street-address' />
                                        </div>
                                        </InputGroup>
                                    </div>

                                    <div className='se-switch-rows'>
                                        <div className='se-switch-row'>
                                            <span>Notificaciones por correo</span>
                                            <Switch checked={Boolean(form.guardian.emailNotifications)} ariaLabel='Notificaciones por correo' action={toggleNotifications('emailNotifications')} />
                                        </div>
                                        <div className='se-switch-row'>
                                            <span>Notificaciones por WhatsApp</span>
                                            <Switch checked={Boolean(form.guardian.whatsappNotifications)} ariaLabel='Notificaciones por WhatsApp' action={toggleNotifications('whatsappNotifications')} />
                                        </div>
                                    </div>

                                    {saveError && <p className='se-error' role='alert'>{saveError}</p>}
                                    <div className='se-form-actions'>
                                        <Button variant='bordered' color='auto' onClick={() => setEditMode(false)} disabled={saving}>Cancelar</Button>
                                        <Button onClick={saveForm} loading={saving} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
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
