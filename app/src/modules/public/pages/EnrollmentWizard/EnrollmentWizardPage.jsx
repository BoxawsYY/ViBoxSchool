import { useParams } from 'react-router-dom'
import EnrollmentWizardContent from './EnrollmentWizardContent'

const EnrollmentWizardPage = () => {
    const { code } = useParams()
    return <EnrollmentWizardContent schoolCode={code} />
}

export default EnrollmentWizardPage
