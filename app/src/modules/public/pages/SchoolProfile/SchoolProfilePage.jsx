import './SchoolProfilePage.css'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PlatformLogo from '../../../../core/components/PlatformLogo/PlatformLogo'
import ThemeToggle from '../../../../core/components/ThemeToggle/ThemeToggle'
import SchoolRequester from '../../services/SchoolRequester.mjs'

const DEMO_SCHOOL_PROFILE = {
    code: 'colegio-san-rafael',
    name: 'Colegio San Rafael',
    city: 'Santa Marta',
    department: 'Magdalena',
    address: 'Cra. 5 #20-45, Santa Marta',
    phone: '+57 605 420 1840',
    secretaryEmail: 'secretaria@sanrafael.edu.co',
    email: 'secretaria@sanrafael.edu.co',
    officeHours: 'Lun–Vie · 7:00 a. m. – 3:00 p. m.',
    levelsOffered: 'Preescolar a 11°',
    schedule: 'Jornada mañana · Calendario A',
    enrollmentPeriod: { academicYear: 2027, startDate: '2026-11-01', endDate: '2027-01-31', status: 'open' },
    gradePeriods: [
        { id: 'preschool', grade: 'Preescolar', availableSeats: 12, enrollmentFee: 720000, tuitionFee: 360000 },
        { id: 'primary-1-4', grade: '1° a 4°', availableSeats: 8, enrollmentFee: 780000, tuitionFee: 390000 },
        { id: 'primary-5', grade: '5°', availableSeats: 0, enrollmentFee: 780000, tuitionFee: 390000 },
        { id: 'secondary-6-9', grade: '6° a 9°', availableSeats: 3, enrollmentFee: 840000, tuitionFee: 420000 },
        { id: 'high-school-10-11', grade: '10° y 11°', availableSeats: 6, enrollmentFee: 900000, tuitionFee: 450000 }
    ],
    requiredDocuments: [
        { name: 'Documento de identidad del estudiante', allowedMimeType: 'application/pdf', maxSizeBytes: 5242880 },
        { name: 'Registro civil de nacimiento', allowedMimeType: 'application/pdf', maxSizeBytes: 5242880 },
        { name: 'Certificado de notas del año anterior', allowedMimeType: 'application/pdf', maxSizeBytes: 5242880 },
        { name: 'Paz y salvo del colegio anterior', allowedMimeType: 'application/pdf', maxSizeBytes: 5242880 },
        { name: 'Fotografía tipo documento', allowedMimeType: 'image/jpeg', maxSizeBytes: 2097152 }
    ]
}

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return '—'
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(Number(amount))
}

const formatDate = (date) => {
    if (!date) return ''
    const dateOnly = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10)
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(`${dateOnly}T12:00:00`))
}

const SchoolProfilePage = () => {
    const { code } = useParams()
    const [school, setSchool] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [logoFailed, setLogoFailed] = useState(false)
    const [isDemo, setIsDemo] = useState(false)

    useEffect(() => {
        let isMounted = true
        setSchool(null)
        setError('')
        setNotice('')
        setLoading(true)

        SchoolRequester.findByCode(code)
            .then((result) => {
                if (!isMounted) return
                setSchool(result)
                setIsDemo(false)
            })
            .catch((requestError) => {
                if (!isMounted) return
                if (code === DEMO_SCHOOL_PROFILE.code) {
                    setSchool(DEMO_SCHOOL_PROFILE)
                    setIsDemo(true)
                } else {
                    setError(requestError.message)
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [code])

    useEffect(() => setLogoFailed(false), [school?.logoUrl])

    const hasDemoDetails = school?.code === DEMO_SCHOOL_PROFILE.code && school.gradePeriods === undefined
    const detail = hasDemoDetails ? DEMO_SCHOOL_PROFILE : school
    const gradePeriods = school?.gradePeriods || (hasDemoDetails ? DEMO_SCHOOL_PROFILE.gradePeriods : [])
    const requiredDocuments = school?.requiredDocuments || (hasDemoDetails ? DEMO_SCHOOL_PROFILE.requiredDocuments : [])
    const enrollmentPeriod = school?.enrollmentPeriod || (hasDemoDetails ? DEMO_SCHOOL_PROFILE.enrollmentPeriod : null)
    const availablePlaces = school?.availablePlaces
        ?? gradePeriods.reduce((total, grade) => total + Number(grade.availableSeats || 0), 0)
    const minEnrollmentFee = gradePeriods.length
        ? Math.min(...gradePeriods.map((grade) => Number(grade.enrollmentFee)).filter(Number.isFinite))
        : null
    const minTuitionFee = gradePeriods.length
        ? Math.min(...gradePeriods.map((grade) => Number(grade.tuitionFee)).filter(Number.isFinite))
        : null
    const brandColor = /^#[\da-f]{6}$/i.test(school?.brandColor || '')
        ? school.brandColor
        : 'var(--lx-color-accent)'
    const initials = useMemo(() => (
        school?.name?.trim().split(/\s+/).slice(0, 2)
            .map((word) => word.charAt(0).toLocaleUpperCase('es')).join('') || 'CO'
    ), [school?.name])
    const enrollmentIsOpen = school?.enrollmentOpen ?? enrollmentPeriod?.status === 'open'

    return (
        <main className='lx-p-school-profile'>
            <header className='lx-p-school-profile-header'>
                <Link to='/' aria-label='ViBoxSchool home'><PlatformLogo /></Link>
                <nav aria-label='Navegación principal'>
                    <Link to='/'>Colegios</Link>
                    <Link to='/#como-funciona'>Cómo funciona</Link>
                    <Link className='lx-p-school-profile-signin' to='/auth'>Ingresar</Link>
                    <ThemeToggle />
                </nav>
            </header>

            {loading && <p className='lx-p-school-profile-state' role='status'>Cargando perfil del colegio...</p>}
            {!loading && error && (
                <div className='lx-p-school-profile-state lx-p-school-profile-error' role='alert'>
                    <h1>No encontramos ese colegio</h1>
                    <p>{error}</p>
                    <Link to='/'>Volver al directorio</Link>
                </div>
            )}
            {!loading && !error && school && (
                <>
                    <section className='lx-p-school-profile-hero' style={{ '--school-brand-color': brandColor }}>
                        <div className='lx-p-school-profile-container'>
                            <nav className='lx-p-school-profile-breadcrumb' aria-label='Breadcrumb'>
                                <Link to='/'>← Directorio</Link>
                                <span aria-hidden='true'>/</span>
                                <span>{school.city}</span>
                                <span aria-hidden='true'>/</span>
                                <span aria-current='page'>{school.name}</span>
                            </nav>

                            <div className='lx-p-school-profile-school'>
                                <div className='lx-p-school-profile-logo'>
                                    {school.logoUrl && !logoFailed
                                        ? <img src={school.logoUrl} alt={`Logo de ${school.name}`} onError={() => setLogoFailed(true)} />
                                        : <span aria-label={`Logo de ${school.name}`}>{initials}</span>}
                                </div>
                                <div className='lx-p-school-profile-heading'>
                                    <div className='lx-p-school-profile-name'>
                                        <h1>{school.name}</h1>
                                        {school.isPartner !== false && <span className='lx-p-school-profile-partner'>Aliado</span>}
                                    </div>
                                    <div className='lx-p-school-profile-badges'>
                                        <span><i className='material-symbols-rounded' aria-hidden='true'>location_on</i>{[school.city, school.department].filter(Boolean).join(', ') || 'Ubicación no disponible'}</span>
                                        <span><i className='material-symbols-rounded' aria-hidden='true'>school</i>{school.levelsOffered || 'Niveles por confirmar'}</span>
                                        <span><i className='material-symbols-rounded' aria-hidden='true'>schedule</i>{detail.schedule || 'Jornada por confirmar'}</span>
                                    </div>
                                    {enrollmentPeriod && (
                                        <div className='lx-p-school-profile-period'>
                                            <span className={enrollmentIsOpen ? 'lx-p-school-profile-open' : 'lx-p-school-profile-closed'}>
                                                {enrollmentIsOpen ? 'Matrículas abiertas' : 'Matrículas cerradas'}
                                            </span>
                                            <span>Periodo de matrícula: {formatDate(enrollmentPeriod.startDate)} – {formatDate(enrollmentPeriod.endDate)}</span>
                                        </div>
                                    )}
                                    <div className='lx-p-school-profile-hero-actions'>
                                        <Link
                                            className='lx-p-school-profile-enroll'
                                            to={`/enroll/${encodeURIComponent(school.code)}`}
                                            aria-disabled={!enrollmentIsOpen}
                                            onClick={(event) => {
                                                if (!enrollmentIsOpen) event.preventDefault()
                                            }}
                                        >
                                            Iniciar matrícula
                                        </Link>
                                        <button
                                            className='lx-p-school-profile-download'
                                            type='button'
                                            onClick={() => {
                                                setNotice('La ficha de requisitos PDF de este colegio aún no está publicada.')
                                                console.info(`Solicitud de ficha de requisitos RF-01 para el colegio "${school.code}"`)
                                            }}
                                        >
                                            Descargar ficha de requisitos (PDF)
                                        </button>
                                        <span className='lx-p-school-profile-pdf-caption'>Ficha oficial del colegio · PDF</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className='lx-p-school-profile-container lx-p-school-profile-body'>
                        {isDemo && <p className='lx-p-school-profile-demo' role='status'>La API no respondió; el perfil muestra datos de demostración.</p>}
                        {!isDemo && hasDemoDetails && (
                            <p className='lx-p-school-profile-demo' role='status'>Cupos, tarifas y documentos son datos de demostración; aún no están configurados para este colegio.</p>
                        )}
                        {notice && <p className='lx-p-school-profile-notice' role='status'>{notice}</p>}

                        <div className='lx-p-school-profile-layout'>
                            <div className='lx-p-school-profile-main'>
                                <section className='lx-p-school-profile-card lx-p-school-profile-grades'>
                                    <h2>Cupos y valores <span>· Año lectivo {enrollmentPeriod?.academicYear || new Date().getFullYear()}</span></h2>
                                    {gradePeriods.length > 0 ? (
                                        <div className='lx-p-school-profile-table-scroll'>
                                            <table>
                                                <thead>
                                                    <tr><th>Grado</th><th>Cupos disponibles</th><th>Matrícula</th><th>Pensión mensual</th></tr>
                                                </thead>
                                                <tbody>
                                                    {gradePeriods.map((grade) => {
                                                        const seats = Number(grade.availableSeats || 0)
                                                        const seatClass = seats === 0
                                                            ? 'lx-p-school-profile-seats--none'
                                                            : seats <= 3 ? 'lx-p-school-profile-seats--low' : ''
                                                        return (
                                                            <tr key={grade.id || grade.grade}>
                                                                <td>{grade.grade || grade.name}</td>
                                                                <td><span className={`lx-p-school-profile-seats ${seatClass}`}>{seats > 0 ? `${seats} cupos` : 'Sin cupos'}</span></td>
                                                                <td>{formatCurrency(grade.enrollmentFee)}</td>
                                                                <td>{formatCurrency(grade.tuitionFee)}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <p className='lx-p-school-profile-empty'>El colegio aún no ha publicado cupos ni valores por grado.</p>}
                                </section>

                                <section className='lx-p-school-profile-card lx-p-school-profile-documents'>
                                    <h2>Documentos requeridos para la matrícula</h2>
                                    {requiredDocuments.length > 0 ? (
                                        <ul>
                                            {requiredDocuments.map((document) => {
                                                const name = typeof document === 'string' ? document : document.name
                                                const maxSize = document.maxSizeBytes
                                                    ? `${Math.round(document.maxSizeBytes / 1024 / 1024)} MB`
                                                    : '5 MB'
                                                const format = document.allowedMimeType?.includes('image') ? 'JPG' : 'PDF'
                                                return (
                                                    <li key={document.id || name}>
                                                        <i className='material-symbols-rounded' aria-hidden='true'>check</i>
                                                        <span>{name}</span>
                                                        <small>{format} · máx. {maxSize}</small>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : <p className='lx-p-school-profile-empty'>El colegio aún no ha publicado los documentos requeridos.</p>}
                                </section>
                            </div>

                            <aside className='lx-p-school-profile-sidebar'>
                                <section className='lx-p-school-profile-card lx-p-school-profile-summary'>
                                    <h2>Resumen de matrícula</h2>
                                    <dl>
                                        <div><dt>Matrícula desde</dt><dd>{formatCurrency(Number.isFinite(minEnrollmentFee) ? minEnrollmentFee : null)}</dd></div>
                                        <div><dt>Pensión desde</dt><dd>{formatCurrency(Number.isFinite(minTuitionFee) ? minTuitionFee : null)}{Number.isFinite(minTuitionFee) ? ' / mes' : ''}</dd></div>
                                        <div><dt>Cupos totales</dt><dd className='lx-p-school-profile-total-seats'>{availablePlaces} disponibles</dd></div>
                                    </dl>
                                    <Link
                                        className='lx-p-school-profile-enroll lx-p-school-profile-enroll-full'
                                        to={`/enroll/${encodeURIComponent(school.code)}`}
                                        aria-disabled={!enrollmentIsOpen}
                                        onClick={(event) => {
                                            if (!enrollmentIsOpen) event.preventDefault()
                                        }}
                                    >
                                        Iniciar matrícula
                                    </Link>
                                    <p>No necesitas cuenta previa: la crearemos al finalizar tu matrícula.</p>
                                </section>

                                <section className='lx-p-school-profile-card lx-p-school-profile-contact'>
                                    <h2>Contacto de Secretaria</h2>
                                    <ul>
                                        {school.secretaryEmail
                                            ? <li><i className='material-symbols-rounded' aria-hidden='true'>mail</i><a href={`mailto:${school.secretaryEmail}`}>{school.secretaryEmail}</a></li>
                                            : <li><i className='material-symbols-rounded' aria-hidden='true'>mail</i><span>Correo de Secretaria por configurar</span></li>}
                                        {school.address
                                            ? <li><i className='material-symbols-rounded' aria-hidden='true'>location_on</i><span>{school.address}</span></li>
                                            : <li><i className='material-symbols-rounded' aria-hidden='true'>location_on</i><span>Ubicación por configurar</span></li>}
                                        {school.officeHours
                                            ? <li><i className='material-symbols-rounded' aria-hidden='true'>schedule</i><span>{school.officeHours}</span></li>
                                            : <li><i className='material-symbols-rounded' aria-hidden='true'>schedule</i><span>Horario de atención por configurar</span></li>}
                                    </ul>
                                </section>
                            </aside>
                        </div>
                    </div>
                </>
            )}

            <footer className='lx-p-school-profile-footer'>
                <Link to='/'><PlatformLogo /></Link>
                <span>© {new Date().getFullYear()} ViBoxSchool · Plataforma multi-colegio</span>
                <Link to='/'>Políticas · Ayuda · Contacto</Link>
            </footer>
        </main>
    )
}

export default SchoolProfilePage
