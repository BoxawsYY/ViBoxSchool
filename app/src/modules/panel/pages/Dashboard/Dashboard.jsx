import './Dashboard.css'
import { timeFormatter, dateFormatter } from '../../../../core/utils/novato.mjs'
import { useAuth } from '../../../../core/contexts/AuthContext'
import Brand from '../../../../core/components/Brand/Brand'

const Dashboard = () => {
    const {session} = useAuth()

    return (session && <>
        <div className='lx-p-dashboard'>
            <div className='lx-p-dashboard-head'>
                <p>{dateFormatter()}</p>
                <h1>{timeFormatter()}, {session.user.name || 'Rewearer'}</h1>
            </div>
            <div className='lx-p-dashboard-body'>
                <Brand color='ghost' size='xxxl' />
            </div>
        </div>
    </>)
}

export default Dashboard