import './Roles.css'
import RoleCard from '../RoleCard/RoleCard'
import Empity from '../../../../core/components/Empity/Empity'

const Roles = ({ roles, onEdit = () => {}, onDelete = () => {}, onActivation = () => {}, onPermissions = () => {} }) => {

    const count = roles.length || 0

    return (<div className='lx-c-roles'>        
        {count > 0 
            ? <div className='lx-c-roles-content'>
                {roles.map(role => <RoleCard key={role.id} role={role} onEdit={onEdit} onDelete={onDelete} onActivation={onActivation} onPermissions={onPermissions} />)}
                </div>
            : <Empity icon='person_shield' message='No hay roles registrados en el sistema' />
        }
    </div>)
}

export default Roles