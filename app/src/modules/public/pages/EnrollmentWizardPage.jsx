import './EnrollmentWizardPage.css'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PlatformLogo from '../../../core/components/PlatformLogo/PlatformLogo'
import SchoolRequester from '../services/SchoolRequester.mjs'

const EnrollmentWizardPage = () => {
    const { code } = useParams()
    const [school, setSchool] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let isMounted = true

        SchoolRequester.findByCode(code)
            .then((result) => {
                if (isMounted) setSchool(result)
            })
            .catch((requestError) => {
                if (isMounted) setError(requestError.message)
            })

        return () => {
            isMounted = false
        }
    }, [code])

    return (
        <main className='lx-p-enrollment-start'>
            <header><Link to='/' aria-label='ViBoxSchool home'><PlatformLogo /></Link></header>
            <section>
                <span className='lx-p-enrollment-start-icon' aria-hidden='true'>✓</span>
                <span className='lx-p-enrollment-start-eyebrow'>PROCESO DE MATRÍCULA</span>
                <h1>{school ? `Matrícula en ${school.name}` : 'Preparando tu matrícula'}</h1>
                <p>El asistente de matrícula estará disponible próximamente. Mientras tanto, puedes consultar los requisitos y comunicarte directamente con el colegio.</p>
                {error && <p className='lx-p-enrollment-start-error' role='alert'>No pudimos verificar los datos del colegio: {error}</p>}
                <div>
                    <Link to={`/school/${encodeURIComponent(code)}`}>Volver al perfil del colegio</Link>
                    <Link to='/'>Ver directorio</Link>
                </div>
            </section>
        </main>
    )
}

export default EnrollmentWizardPage
