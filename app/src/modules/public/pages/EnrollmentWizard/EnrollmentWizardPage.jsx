import './EnrollmentWizardPage.css'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PlatformLogo from '../../../../core/components/PlatformLogo/PlatformLogo'
import ThemeToggle from '../../../../core/components/ThemeToggle/ThemeToggle'
import EnrollmentRequester from '../../services/EnrollmentRequester.mjs'
import SchoolRequester from '../../services/SchoolRequester.mjs'

const STEPS = ['Estudiante', 'Acudiente', 'Documentos', 'Revisión', 'Confirmación']
const EMPTY_STUDENT = {
    firstNames: '',
    lastNames: '',
    documentType: 'TI',
    documentNumber: '',
    birthDate: '',
    phone: '',
    address: '',
    shift: 'morning'
}
const EMPTY_GUARDIAN = {
    name: '',
    documentType: 'CC',
    documentNumber: '',
    email: '',
    whatsapp: '',
    address: '',
    relationship: 'mother',
    emailNotifications: true,
    whatsappNotifications: true
}

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
}).format(Number(value) || 0)

const formatMegabytes = (bytes) => (Number(bytes) / 1024 / 1024)
    .toLocaleString('es-CO', { maximumFractionDigits: 1 })

const getToday = () => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getImageDimensions = (file) => new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight })
    }
    image.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('No se pudo leer la imagen. Selecciona un archivo JPG válido.'))
    }
    image.src = objectUrl
})

const EnrollmentWizardPage = () => {
    const { code } = useParams()
    const [school, setSchool] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [step, setStep] = useState(1)
    const [student, setStudent] = useState(EMPTY_STUDENT)
    const [guardian, setGuardian] = useState(EMPTY_GUARDIAN)
    const [gradePeriodId, setGradePeriodId] = useState('')
    const [draft, setDraft] = useState(null)
    const [documents, setDocuments] = useState({})
    const [busy, setBusy] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [enrollment, setEnrollment] = useState(null)

    useEffect(() => {
        let isMounted = true
        setLoading(true)
        setLoadError('')
        setSchool(null)
        setEnrollment(null)
        setError('')
        setNotice('')
        setStep(1)
        setStudent({ ...EMPTY_STUDENT })
        setGuardian({ ...EMPTY_GUARDIAN })
        setGradePeriodId('')
        setDraft(null)
        setDocuments({})
        setAcceptedTerms(false)

        SchoolRequester.findByCode(code)
            .then((result) => {
                if (!isMounted) return
                setSchool(result)
                setGradePeriodId(result.gradePeriods?.find((period) => Number(period.availableSeats) > 0)?.id || '')
            })
            .catch((requestError) => {
                if (isMounted) setLoadError(requestError.message || 'No se pudo cargar el colegio')
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [code])

    const availablePeriods = useMemo(
        () => (school?.gradePeriods || []).filter((period) => Number(period.availableSeats) > 0),
        [school]
    )
    const selectedPeriod = availablePeriods.find((period) => period.id === gradePeriodId)
    const requiredDocuments = useMemo(
        () => (school?.requiredDocuments || []).filter(
            (document) => document.isRequired && selectedPeriod && document.gradeId === selectedPeriod.gradeId
        ),
        [school, selectedPeriod]
    )
    const studentFullName = `${student.firstNames} ${student.lastNames}`.trim()
    const completion = step * 20
    const isOpen = school?.enrollmentOpen === true
    const documentUploadsComplete = requiredDocuments.every(
        (document) => documents[document.id]?.status === 'uploaded'
    )

    const updateStudent = (event) => {
        setStudent((current) => ({ ...current, [event.target.name]: event.target.value }))
    }

    const updateGuardian = (event) => {
        const { name, value, checked, type } = event.target
        setGuardian((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    }

    const createDraft = async (event) => {
        event.preventDefault()
        setError('')
        setBusy(true)
        try {
            const result = await EnrollmentRequester.createDraft({
                schoolCode: code,
                gradePeriodId,
                student: {
                    name: studentFullName,
                    documentType: student.documentType,
                    documentNumber: student.documentNumber.trim(),
                    birthDate: student.birthDate,
                    phone: student.phone.trim(),
                    address: student.address.trim(),
                    shift: student.shift
                },
                guardian: {
                    ...guardian,
                    name: guardian.name.trim(),
                    documentNumber: guardian.documentNumber.trim(),
                    email: guardian.email.trim().toLowerCase(),
                    phone: guardian.whatsapp.trim(),
                    whatsapp: guardian.whatsapp.trim(),
                    address: guardian.address.trim()
                }
            })
            setDraft(result)
            setStep(3)
        } catch (requestError) {
            setError(requestError.message || 'No se pudo guardar la información')
        } finally {
            setBusy(false)
        }
    }

    const uploadDocument = async (document, file) => {
        if (!file || !draft) return
        setError('')
        const mimeTypes = (document.allowedMimeType || 'application/pdf')
            .split(/[|,]/).map((type) => type.trim()).filter(Boolean)

        if (!mimeTypes.includes(file.type)) {
            setDocuments((current) => ({
                ...current,
                [document.id]: { status: 'error', message: 'Selecciona un archivo PDF o JPG permitido.' }
            }))
            return
        }
        if (file.size > Number(document.maxSizeBytes)) {
            setDocuments((current) => ({
                ...current,
                [document.id]: {
                    status: 'error',
                    message: `El archivo supera el máximo de ${formatMegabytes(document.maxSizeBytes)} MB.`
                }
            }))
            return
        }

        setDocuments((current) => ({
            ...current,
            [document.id]: { ...current[document.id], status: 'uploading', fileName: file.name }
        }))
        try {
            const dimensions = file.type === 'image/jpeg' ? await getImageDimensions(file) : {}
            if ((document.minWidthPx && dimensions.widthPx < document.minWidthPx)
                || (document.minHeightPx && dimensions.heightPx < document.minHeightPx)
                || (document.maxWidthPx && dimensions.widthPx > document.maxWidthPx)
                || (document.maxHeightPx && dimensions.heightPx > document.maxHeightPx)) {
                throw new Error('Las dimensiones de la imagen no cumplen los requisitos del colegio.')
            }
            await EnrollmentRequester.uploadDocument(draft, document, file, dimensions)
            setDocuments((current) => ({
                ...current,
                [document.id]: {
                    status: 'uploaded',
                    fileName: file.name,
                    sizeBytes: file.size
                }
            }))
        } catch (uploadError) {
            setDocuments((current) => ({
                ...current,
                [document.id]: {
                    status: 'error',
                    fileName: file.name,
                    message: uploadError.message || 'No se pudo cargar el documento.'
                }
            }))
        }
    }

    const submitEnrollment = async (event) => {
        event.preventDefault()
        setError('')
        if (!documentUploadsComplete) {
            setError('Carga todos los documentos obligatorios antes de continuar.')
            setStep(3)
            return
        }
        setStep(4)
    }

    const sendEnrollment = async () => {
        if (!acceptedTerms) {
            setError('Debes aceptar el tratamiento de datos y las políticas de matrícula.')
            return
        }
        setError('')
        setBusy(true)
        try {
            const result = await EnrollmentRequester.submitDraft(draft.id, draft.accessToken)
            setEnrollment(result)
            setStep(5)
        } catch (requestError) {
            setError(requestError.message || 'No se pudo enviar la matrícula')
        } finally {
            setBusy(false)
        }
    }

    const copyText = async (value, label) => {
        try {
            await navigator.clipboard.writeText(value)
            setNotice(`${label} copiado.`)
        } catch {
            setError(`No se pudo copiar ${label.toLowerCase()}. Selecciónalo y cópialo manualmente.`)
        }
    }

    const renderProgress = () => (
        <nav className='lx-enrollment-progress' aria-label='Pasos de matrícula'>
            <ol>
                {STEPS.map((label, index) => {
                    const number = index + 1
                    const state = number < step ? 'is-complete' : number === step ? 'is-current' : ''
                    return (
                        <li className={state} key={label} aria-current={number === step ? 'step' : undefined}>
                            <span className='lx-enrollment-progress-marker'>
                                {number < step ? '✓' : number}
                            </span>
                            <span className='lx-enrollment-progress-label'>{label}</span>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )

    const renderSummary = () => (
        <aside className='lx-enrollment-aside'>
            <section className='lx-enrollment-side-card lx-enrollment-summary'>
                <h2>Tu matrícula</h2>
                <div className='lx-enrollment-school-summary'>
                    <span className='lx-enrollment-school-mark' aria-hidden='true'>
                        {(school?.name || 'V').slice(0, 2).toUpperCase()}
                    </span>
                    <div><strong>{school?.name}</strong><span>{school?.city || school?.department || 'Colombia'}</span></div>
                </div>
                <dl>
                    <div><dt>Grado</dt><dd>{selectedPeriod?.grade || 'Por seleccionar'}</dd></div>
                    <div><dt>Valor de matrícula</dt><dd>{formatCurrency(selectedPeriod?.enrollmentFee)}</dd></div>
                    <div><dt>Pensión mensual</dt><dd>{formatCurrency(selectedPeriod?.tuitionFee)}</dd></div>
                    <div><dt>Cupos disponibles</dt><dd className='lx-enrollment-seats'>{selectedPeriod?.availableSeats || 0}</dd></div>
                </dl>
            </section>
            <section className='lx-enrollment-side-card lx-enrollment-request-progress'>
                <h2>Progreso de tu solicitud</h2>
                <div className='lx-enrollment-progress-track' role='progressbar'
                    aria-valuenow={completion} aria-valuemin='0' aria-valuemax='100'>
                    <span style={{ width: `${completion}%` }} />
                </div>
                <p>Paso {step} de 5 · {completion}% completado</p>
                <small>Tu información se guarda automáticamente.</small>
            </section>
        </aside>
    )

    const renderStudentStep = () => (
        <form className='lx-enrollment-form' onSubmit={(event) => { event.preventDefault(); setError(''); setStep(2) }}>
            <section className='lx-enrollment-card-section'>
                <h2>Datos personales</h2>
                <div className='lx-enrollment-fields'>
                    <label>Nombres
                        <input name='firstNames' value={student.firstNames} onChange={updateStudent} autoComplete='given-name' required maxLength='79' />
                    </label>
                    <label>Apellidos
                        <input name='lastNames' value={student.lastNames} onChange={updateStudent} autoComplete='family-name' required maxLength='79' />
                    </label>
                    <label>Tipo de documento
                        <select name='documentType' value={student.documentType} onChange={updateStudent} required>
                            <option value='TI'>Tarjeta de identidad</option><option value='RC'>Registro civil</option>
                            <option value='CC'>Cédula de ciudadanía</option><option value='CE'>Cédula de extranjería</option>
                            <option value='PPT'>PPT</option><option value='PASSPORT'>Pasaporte</option>
                        </select>
                    </label>
                    <label>Número de documento
                        <input name='documentNumber' value={student.documentNumber} onChange={updateStudent} required maxLength='40' />
                    </label>
                    <label>Fecha de nacimiento
                        <input name='birthDate' type='date' max={getToday()} value={student.birthDate} onChange={updateStudent} required />
                    </label>
                    <label>Teléfono de contacto
                        <input name='phone' type='tel' autoComplete='tel' value={student.phone} onChange={updateStudent} required maxLength='30' />
                    </label>
                    <label className='lx-enrollment-field-full'>Dirección de residencia
                        <input name='address' autoComplete='street-address' value={student.address} onChange={updateStudent} required maxLength='160' />
                    </label>
                </div>
            </section>
            <section className='lx-enrollment-card-section'>
                <h2>Grado al que aspira</h2>
                <div className='lx-enrollment-fields'>
                    <label>Grado
                        <select value={gradePeriodId} onChange={(event) => setGradePeriodId(event.target.value)} required>
                            {availablePeriods.map((period) => (
                                <option key={period.id} value={period.id}>{period.grade}</option>
                            ))}
                        </select>
                        <small>{selectedPeriod?.availableSeats || 0} cupos disponibles para este grado</small>
                    </label>
                    <label>Jornada
                        <select name='shift' value={student.shift} onChange={updateStudent} required>
                            <option value='morning'>Mañana</option><option value='afternoon'>Tarde</option>
                        </select>
                    </label>
                </div>
            </section>
            <div className='lx-enrollment-actions lx-enrollment-actions-end'>
                <button className='lx-enrollment-button' type='submit'>Continuar</button>
            </div>
        </form>
    )

    const renderGuardianStep = () => (
        <form className='lx-enrollment-form' onSubmit={createDraft}>
            <section className='lx-enrollment-card-section'>
                <h2>Datos del acudiente</h2>
                <p className='lx-enrollment-section-intro'>Esta persona recibirá el acceso a la plataforma y las notificaciones.</p>
                <div className='lx-enrollment-fields'>
                    <label>Nombre completo
                        <input name='name' value={guardian.name} onChange={updateGuardian} autoComplete='name' required maxLength='160' />
                    </label>
                    <label>Tipo de documento
                        <select name='documentType' value={guardian.documentType} onChange={updateGuardian} required>
                            <option value='CC'>Cédula de ciudadanía</option><option value='CE'>Cédula de extranjería</option>
                            <option value='PPT'>PPT</option><option value='PASSPORT'>Pasaporte</option>
                        </select>
                    </label>
                    <label>Número de documento
                        <input name='documentNumber' value={guardian.documentNumber} onChange={updateGuardian} required maxLength='40' />
                    </label>
                    <label>Correo electrónico
                        <input name='email' type='email' value={guardian.email} onChange={updateGuardian} autoComplete='email' required maxLength='160' />
                        <small>Aquí enviaremos confirmaciones y recordatorios.</small>
                    </label>
                    <label>WhatsApp
                        <input name='whatsapp' type='tel' value={guardian.whatsapp} onChange={updateGuardian} autoComplete='tel' required maxLength='30' />
                        <small>Incluye el indicativo de país si es extranjero.</small>
                    </label>
                    <label>Parentesco
                        <select name='relationship' value={guardian.relationship} onChange={updateGuardian} required>
                            <option value='mother'>Madre</option><option value='father'>Padre</option>
                            <option value='guardian'>Acudiente</option><option value='other'>Otro</option>
                        </select>
                    </label>
                    <label>Dirección
                        <input name='address' value={guardian.address} onChange={updateGuardian} autoComplete='street-address' required maxLength='160' />
                    </label>
                </div>
            </section>
            <section className='lx-enrollment-card-section'>
                <h2>Preferencias de notificación</h2>
                <label className='lx-enrollment-checkbox'>
                    <input type='checkbox' name='emailNotifications' checked={guardian.emailNotifications} onChange={updateGuardian} />
                    Recibir confirmaciones, observaciones y recordatorios de pago por correo
                </label>
                <label className='lx-enrollment-checkbox'>
                    <input type='checkbox' name='whatsappNotifications' checked={guardian.whatsappNotifications} onChange={updateGuardian} />
                    Recibir alertas de mora y vencimientos por WhatsApp
                </label>
            </section>
            <div className='lx-enrollment-actions lx-enrollment-actions-split'>
                <button className='lx-enrollment-button lx-enrollment-button-outline' type='button' onClick={() => setStep(1)}>Atrás</button>
                <button className='lx-enrollment-button' type='submit' disabled={busy}>{busy ? 'Guardando...' : 'Continuar'}</button>
            </div>
        </form>
    )

    const renderDocumentsStep = () => (
        <form className='lx-enrollment-form' onSubmit={submitEnrollment}>
            <p className='lx-enrollment-info-banner'>
                Formatos permitidos: PDF o JPG según cada requisito. Un archivo por documento; el tamaño máximo se indica en cada tarjeta.
            </p>
            {requiredDocuments.length === 0 ? (
                <p className='lx-enrollment-empty-documents'>El colegio no publicó documentos obligatorios para este grado.</p>
            ) : requiredDocuments.map((document) => {
                const file = documents[document.id]
                const mimeTypes = (document.allowedMimeType || 'application/pdf')
                    .split(/[|,]/).map((type) => type.trim()).filter(Boolean)
                const maxSizeMb = formatMegabytes(document.maxSizeBytes)
                return (
                    <section className='lx-enrollment-upload-card' key={document.id}>
                        <div className='lx-enrollment-upload-heading'>
                            <span className='lx-enrollment-file-icon' aria-hidden='true'>▤</span>
                            <div><h2>{document.name}</h2><p>{mimeTypes.map((type) => type === 'image/jpeg' ? 'JPG' : 'PDF').join(' o ')} · máx. {maxSizeMb} MB</p></div>
                            <span className={`lx-enrollment-upload-status ${file?.status || 'pending'}`}>
                                {file?.status === 'uploaded' ? 'Cargado' : file?.status === 'uploading' ? 'Subiendo...' : file?.status === 'error' ? 'Error' : 'Pendiente'}
                            </span>
                            <label className='lx-enrollment-file-picker'>
                                {file?.status === 'uploaded' ? 'Reemplazar' : 'Seleccionar archivo'}
                                <input type='file' accept={mimeTypes.join(',')} disabled={busy || file?.status === 'uploading'}
                                    onChange={(event) => {
                                        uploadDocument(document, event.target.files?.[0])
                                        event.target.value = ''
                                    }} />
                            </label>
                        </div>
                        {file?.status === 'uploaded' ? (
                            <p className='lx-enrollment-upload-message is-success'>
                                ✓ {file.fileName} · {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB · cargado correctamente
                            </p>
                        ) : file?.status === 'error' ? (
                            <p className='lx-enrollment-upload-message is-error' role='alert'>! {file.message}</p>
                        ) : (
                            <p className='lx-enrollment-upload-placeholder'
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                    event.preventDefault()
                                    uploadDocument(document, event.dataTransfer.files?.[0])
                                }}>
                                ⇧ Arrastra el archivo aquí o haz clic en “Seleccionar archivo”
                            </p>
                        )}
                    </section>
                )
            })}
            <div className='lx-enrollment-actions lx-enrollment-actions-split'>
                <button className='lx-enrollment-button lx-enrollment-button-outline' type='button' onClick={() => setStep(2)}>Atrás</button>
                <button className='lx-enrollment-button' type='submit' disabled={!documentUploadsComplete}>Continuar</button>
            </div>
        </form>
    )

    const renderReviewStep = () => (
        <div className='lx-enrollment-form'>
            <section className='lx-enrollment-review-card'>
                <div className='lx-enrollment-review-heading'><h2>Estudiante</h2><button type='button' onClick={() => setStep(1)}>Editar</button></div>
                <dl>
                    <div><dt>Nombre</dt><dd>{studentFullName}</dd></div>
                    <div><dt>Documento</dt><dd>{student.documentType} · {student.documentNumber}</dd></div>
                    <div><dt>Fecha de nacimiento</dt><dd>{new Date(`${student.birthDate}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</dd></div>
                    <div><dt>Teléfono</dt><dd>{student.phone}</dd></div>
                    <div><dt>Dirección</dt><dd>{student.address}</dd></div>
                    <div><dt>Grado solicitado</dt><dd>{selectedPeriod?.grade} · Jornada {student.shift === 'morning' ? 'mañana' : 'tarde'}</dd></div>
                </dl>
            </section>
            <section className='lx-enrollment-review-card'>
                <div className='lx-enrollment-review-heading'><h2>Acudiente</h2><button type='button' onClick={() => setStep(2)}>Editar</button></div>
                <dl>
                    <div><dt>Nombre</dt><dd>{guardian.name}</dd></div>
                    <div><dt>Documento</dt><dd>{guardian.documentType} · {guardian.documentNumber}</dd></div>
                    <div><dt>Correo</dt><dd>{guardian.email}</dd></div>
                    <div><dt>WhatsApp</dt><dd>{guardian.whatsapp}</dd></div>
                    <div><dt>Parentesco</dt><dd>{guardian.relationship === 'mother' ? 'Madre' : guardian.relationship === 'father' ? 'Padre' : guardian.relationship === 'guardian' ? 'Acudiente' : 'Otro'}</dd></div>
                    <div><dt>Dirección</dt><dd>{guardian.address}</dd></div>
                    <div><dt>Notificaciones</dt><dd>Correo: {guardian.emailNotifications ? 'Sí' : 'No'} · WhatsApp: {guardian.whatsappNotifications ? 'Sí' : 'No'}</dd></div>
                </dl>
            </section>
            <section className='lx-enrollment-review-card'>
                <div className='lx-enrollment-review-heading'><h2>Documentos</h2><button type='button' onClick={() => setStep(3)}>Editar</button></div>
                <dl>
                    {requiredDocuments.length ? requiredDocuments.map((document) => (
                        <div key={document.id}><dt>{document.name}</dt><dd>{documents[document.id]?.status === 'uploaded' ? 'Cargado' : 'Pendiente'}</dd></div>
                    )) : <div><dt>Requisitos</dt><dd>Sin documentos obligatorios</dd></div>}
                </dl>
            </section>
            <label className='lx-enrollment-consent'>
                <input type='checkbox' checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
                Acepto el tratamiento de mis datos personales y las políticas de matrícula de {school?.name}.
            </label>
            <div className='lx-enrollment-actions lx-enrollment-actions-split'>
                <button className='lx-enrollment-button lx-enrollment-button-outline' type='button' onClick={() => setStep(3)}>Atrás</button>
                <button className='lx-enrollment-button' type='button' onClick={sendEnrollment} disabled={busy}>
                    {busy ? 'Enviando...' : 'Enviar matrícula'}
                </button>
            </div>
        </div>
    )

    const renderConfirmationStep = () => (
        <div className='lx-enrollment-confirmation'>
            <div className='lx-enrollment-confirmation-title'>
                <span aria-hidden='true'>✓</span>
                <div><h1>¡Solicitud de matrícula enviada!</h1><p>Creamos tu acceso y asociamos a {studentFullName} al {school?.name}.</p></div>
            </div>
            <section className='lx-enrollment-confirmation-card'>
                <h2>Tus credenciales de acceso</h2>
                <div className='lx-enrollment-credential'>
                    <div><span>Usuario</span><strong>{enrollment?.username}</strong></div>
                    <button type='button' onClick={() => copyText(enrollment?.username || '', 'Usuario')}>Copiar</button>
                </div>
                <div className='lx-enrollment-credential'>
                    <div><span>Contraseña temporal</span><strong>{enrollment?.temporaryPassword}</strong></div>
                    <button type='button' onClick={() => copyText(enrollment?.temporaryPassword || '', 'Contraseña')}>Copiar</button>
                </div>
                <p className='lx-enrollment-password-warning'>Guarda esta contraseña ahora: no volverá a mostrarse. Deberás cambiarla en tu primer ingreso.</p>
                <div className='lx-enrollment-actions'>
                    <Link className='lx-enrollment-button' to='/auth'>Ingresar a mi panel</Link>
                    <Link className='lx-enrollment-button lx-enrollment-button-outline' to={`/school/${encodeURIComponent(code)}`}>Volver al colegio</Link>
                </div>
            </section>
        </div>
    )

    const stepTitle = {
        1: ['Datos del estudiante', 'Ingresa la información del estudiante que deseas matricular.'],
        2: ['Datos del acudiente', 'Esta persona recibirá el acceso a la plataforma y las notificaciones.'],
        3: ['Carga de documentos', `Sube los documentos exigidos por ${school?.name}. Puedes continuar luego desde tu panel.`],
        4: ['Revisa tu solicitud', 'Verifica que la información sea correcta antes de enviarla.']
    }

    return (
        <main className='lx-p-enrollment-start'>
            <header className='lx-enrollment-header'>
                <Link to='/' aria-label='Inicio de ViBoxSchool'><PlatformLogo /></Link>
                <span className='lx-enrollment-header-school'>Matrícula en: <strong>{school?.name || 'ViBoxSchool'}</strong></span>
                <div className='lx-enrollment-header-actions'>
                    {school?.email && <a href={`mailto:${school.email}`}>¿Necesitas ayuda?</a>}
                    <Link to={`/school/${encodeURIComponent(code || '')}`}>Guardar y salir</Link>
                    <ThemeToggle />
                </div>
            </header>

            <div className='lx-enrollment-shell'>
                {renderProgress()}
                {error && <p className='lx-enrollment-alert' role='alert'>{error}</p>}
                {notice && <p className='lx-enrollment-notice' role='status'>{notice}</p>}

                {loading ? <p className='lx-enrollment-loading' role='status'>Cargando información del colegio...</p>
                    : loadError ? (
                        <section className='lx-enrollment-state-card'>
                            <h1>No pudimos abrir la matrícula</h1><p role='alert'>{loadError}</p><Link to='/'>Volver al directorio</Link>
                        </section>
                    ) : !school ? null : !isOpen ? (
                        <section className='lx-enrollment-state-card'>
                            <h1>Matrículas no disponibles</h1><p>El periodo de matrícula de {school.name} no está abierto en este momento.</p>
                            <Link to={`/school/${encodeURIComponent(code)}`}>Volver al perfil del colegio</Link>
                        </section>
                    ) : availablePeriods.length === 0 ? (
                        <section className='lx-enrollment-state-card'>
                            <h1>Sin cupos publicados</h1><p>El periodo está abierto, pero {school.name} todavía no ha publicado grados con cupos disponibles.</p>
                            <Link to={`/school/${encodeURIComponent(code)}`}>Volver al perfil del colegio</Link>
                        </section>
                    ) : step === 5 ? (
                        <div className='lx-enrollment-complete-layout'>
                            {renderConfirmationStep()}
                            <aside className='lx-enrollment-aside'>
                                <section className='lx-enrollment-side-card lx-enrollment-expedient'>
                                    <h2>Estado de tu expediente</h2>
                                    <strong>{enrollment?.fileNumber}</strong>
                                    <span>En verificación de documentos</span>
                                    <dl>
                                        <div><dt>Asociado a</dt><dd>{school.name}</dd></div>
                                        <div><dt>Grado</dt><dd>{selectedPeriod?.grade} · Jornada {student.shift === 'morning' ? 'mañana' : 'tarde'}</dd></div>
                                        <div><dt>Matrícula</dt><dd>{formatCurrency(selectedPeriod?.enrollmentFee)}</dd></div>
                                    </dl>
                                </section>
                                <section className='lx-enrollment-side-card lx-enrollment-next-steps'>
                                    <h2>Próximos pasos</h2>
                                    <p><b>1</b> Rectoría verifica tus documentos.</p><p><b>2</b> Te avisaremos por correo y WhatsApp con el resultado.</p>
                                    <p><b>3</b> Paga la matrícula en línea o en Secretaría para formalizarla.</p>
                                </section>
                            </aside>
                        </div>
                    ) : (
                        <>
                            <div className='lx-enrollment-layout'>
                                <section className='lx-enrollment-main-column'>
                                    <div className='lx-enrollment-step-heading'>
                                        <span className='lx-enrollment-eyebrow'>MATRÍCULA EN LÍNEA · {school.name}</span>
                                        <h1>{stepTitle[step][0]}</h1><p>{stepTitle[step][1]}</p>
                                    </div>
                                    {step === 1 && renderStudentStep()}
                                    {step === 2 && renderGuardianStep()}
                                    {step === 3 && renderDocumentsStep()}
                                    {step === 4 && renderReviewStep()}
                                </section>
                                {renderSummary()}
                            </div>
                        </>
                    )}
            </div>
        </main>
    )
}

export default EnrollmentWizardPage
