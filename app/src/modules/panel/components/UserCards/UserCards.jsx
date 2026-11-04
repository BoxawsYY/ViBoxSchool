import './UserCards.css'
import UserCard from '../UserCard/UserCard'
import Empity from '../../../../core/components/Empity/Empity'

const UserCards = ({ users = [], onDelete = () => {}, onAuthorization = () => {}, onRoles  = () => {}, onView = () => {}}) => {
    const count = users.length || 0

    return (<div className='lx-c-users'>        
        {count > 0 
            ? <div className='lx-c-users-content'>
                {users.map(user => <UserCard key={user.id} user={user} onDelete={onDelete} onAuthorization={onAuthorization} onRoles={onRoles} onView={onView} />)}
                </div>
            : <Empity icon='person' message='No hay usuarios registrados en el sistema' />
        }
    </div>)
}

export default UserCards