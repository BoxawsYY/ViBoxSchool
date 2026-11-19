import './SecretaryEnrollmentsPage.css'
import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../../core/components/Modal/Modal'
import { useAuth } from '../../../../core/contexts/AuthContext'
import EnrollmentsRequester from '../../services/EnrollmentsRequester.mjs'
import EnrollmentWizardContent from '../../../public/pages/EnrollmentWizard/EnrollmentWizardContent'

const formatDate = (value) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const SecretaryEnrollmentsPage = () => {
    const { user } = useAuth()
    const schoolCode = user?.school?.code || null
    const [queue, setQueue] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showWizard, setShowWizard] = useState(false)
    const [notice, setNotice] = useState('')

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

    return (
        <section className='lx-se-enrollments'>
            <header className='lx-se-enrollments-header'>
                <div>
                    <span className='lx-se-enrollments-eyebrow'>GESTIÓN DE MATRÍCULAS</span>
                    <h1>Matrículas</h1>
                    <p>Expedientes que tu colegio debe revisar. Crear una matrícula desde aquí reutiliza el mismo flujo del padre sin salir del panel.</p>
                </div>
                <button type='button' className='lx-se-enrollments-primary' onClick={() => setShowWizard(true)} disabled={!schoolCode}>
                    <span className='material-symbols-rounded' aria-hidden='true'>add_circle</span>
                    Nueva matrícula
                </button>
            </header>

            {notice && <p className='lx-se-enrollments-notice' role='status'>{notice}</p>}
            {!schoolCode && (
                <p className='lx-se-enrollments-error' role='alert'>
                    Tu usuario no tiene un colegio asociado, por eso no se puede crear ni listar matrículas. Pide a Rectoría/Administrador que te asigne el colegio.
                </p>
            )}

            <section className='lx-se-enrollments-card'>
                <div className='lx-se-enrollments-card-heading'>
                    <h2>Pendientes de verificación</h2>
                    <button type='button' className='lx-se-enrollments-ghost' onClick={loadQueue} disabled={loading}>
                        {loading ? 'Cargando…' : 'Actualizar'}
                    </button>
                </div>
                {error ? <p className='lx-se-enrollments-error' role='alert'>{error}</p>
                    : loading ? <p className='lx-se-enrollments-state' role='status'>Cargando expedientes…</p>
                    : queue.length === 0 ? (
                        <p className='lx-se-enrollments-state'>No hay expedientes pendientes de verificación en este momento.</p>
                    ) : (
                        <div className='lx-se-enrollments-table-wrap'>
                            <table className='lx-se-enrollments-table'>
                                <thead>
                                    <tr>
                                        <th scope='col'>Expediente</th>
                                        <th scope='col'>Estudiante</th>
                                        <th scope='col'>Grado</th>
                                        <th scope='col'>Documentos</th>
                                        <th scope='col'>Correcciones</th>
                                        <th scope='col'>Solicitada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.map((item) => (
                                        <tr key={item.enrollmentId}>
                                            <td><strong>{item.fileNumber}</strong></td>
                                            <td>{item.studentName}</td>
                                            <td>{item.grade}</td>
                                            <td>{item.uploadedDocuments}/{item.requiredDocuments} cargados</td>
                                            <td>{item.hasCorrections ? 'Sí' : '—'}</td>
                                            <td>{formatDate(item.requestedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
        </section>
    )
}

export default SecretaryEnrollmentsPage
