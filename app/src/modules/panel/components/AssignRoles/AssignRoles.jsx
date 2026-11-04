import './AssignRoles.css'
import Icon from '../../../../core/components/Icon/Icon'
import Table from '../../../../core/components/Table/Table'
import Switch from '../../../../core/components/Switch/Switch.jsx'
import Empity from '../../../../core/components/Empity/Empity.jsx'

const AssignRoles = ({ roles, user, onRole }) => {

    const count = roles.length || 0

    const icons = { Admin: 'manage_accounts', User: 'person_check', Guest: 'person', Veterinarian: 'person_heart', Operator: 'person_apron'}

    const rolesWithAssignment = roles.map(r => ({
        ...r,
        isAssigned: user?.roles?.some(ur => ur.id === r.id) || false,
    }));

    return (
        <div className={`lx-c-assign-roles ${user ? '--with-user' : ''}`}>
            {user && (
                <div className='lx-lx-c-assign-roles-user-header'>
                    <h1 className='lx-text-bold lx-text-color'>{user.name || 'Sin nombre'}</h1>
                    <p className='lx-text-color-softer'>@{user.username || 'username'}</p>
                    <br />
                </div>
            )}
            <div className='lx-c-assign-roles-content'>
                {count > 0 
                    ? <Table
                        objects={rolesWithAssignment}
                        mapper={(role) => ({
                            '': (
                                <Icon 
                                    className={`lx-c-assign-roles-icon --${role.name || 'unknown'}`} 
                                    name={icons[role.name] || 'person_shield'} 
                                />
                            ),
                            alias: <span className='lx-text-bold lx-text-color'>{role.alias}</span>,
                            isAssigned: (
                                <center>
                                    <Switch checked={role.isAssigned} action={() => onRole(user, role)} />
                                </center>
                            )
                        })}
                        sort={['alias']}
                        translation={{
                            alias: 'Rol',
                            isAssigned: 'Asignado'
                        }}
                        selectionable={false}
                        whenDropdown={(role) => <div className='lx-c-assign-roles-description'>{role.description}</div>}
                    />
                    : <Empity icon='shield' message='No hay permisos registrados en el sistema' />
                }
            </div>
        </div>
    )
}

export default AssignRoles
