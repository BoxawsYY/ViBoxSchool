import './Permissions.css'
import { dateCountdown } from '../../../../core/utils/dateCountdown.mjs'
import Icon from '../../../../core/components/Icon/Icon'
import Table from '../../../../core/components/Table/Table'
import PermissionDetails from '../PermissionDetails/PermissionDetails.jsx'
import Switch from '../../../../core/components/Switch/Switch.jsx'
import Empity from '../../../../core/components/Empity/Empity.jsx'

const Permissions = ({ permissions, role, onPermission }) => {

    const count = permissions.length || 0

    const icons = {
        Read: 'policy',
        Create: 'health_and_safety',
        Update: 'arming_countdown',
        Delete: 'gpp_bad',
        Assign: 'encrypted',
        Check: 'verified_user',
        Revoke: 'encrypted_off',
        Access: 'local_police'
    }

    const permissionsWithAssignment = permissions.map(p => ({
        ...p,
        isAssigned: role?.permissions?.some(rp => rp.id === p.id) || false,
    }));

    const fullMapper = (permission) => ({
        '': (
            <Icon
                className={`lx-c-permissions-icon --${permission.type?.toLowerCase() || 'unknown'}`}
                name={icons[permission.type] || 'shield_question'}
            />
        ),
        alias: <span className='lx-text-bold lx-text-color'>{permission.alias}</span>,
        type: (
            <center>
                <span className={`lx-c-permissions-type --${permission.type?.toLowerCase() || 'unknown'}`}>
                    {permission.type || 'Desconocido'}
                </span>
            </center>
        ),
        name: <span className='lx-text-color-soft'>{`<${permission.name}>`}</span>,
        description: <span className='lx-text-color-softer'>{permission.description}</span>,
        createdAt: <span className='lx-text-color-softest'>{dateCountdown(permission.createdAt)}</span>
    });

    const reducedMapper = (permission) => ({
        '': (
            <Icon
                className={`lx-c-permissions-icon --${permission.type?.toLowerCase() || 'unknown'}`}
                name={icons[permission.type] || 'shield_question'}
            />
        ),
        alias: <span className='lx-text-bold lx-text-color'>{permission.alias}</span>,
        isAssigned: (
            <center>
                <Switch checked={permission.isAssigned} action={() => onPermission(role, permission)} />
            </center>
        )
    });

    return (
        <div className={`lx-c-permissions ${role ? '--with-role' : ''}`}>
            {role && (
                <div className='lx-c-permissions-role-header'>
                    <h1 className='lx-text-bold lx-text-color'>{role.name}</h1>
                    <p className='lx-text-color-softer'>{role.description}</p>
                    <br />
                </div>
            )}
            <div className='lx-c-permissions-content'>
                {count > 0
                    ? <Table
                        objects={permissionsWithAssignment}
                        mapper={role ? reducedMapper : fullMapper}
                        attributes={['id', 'status', 'isActive', 'isDeleted', 'updatedAt', 'createdBy', 'updatedBy', 'deletedAt', 'deletedBy']}
                        sort={['name', 'alias', 'description']}
                        filters={['type']}
                        translation={{
                            alias: 'Permiso',
                            name: 'Nombre',
                            description: 'Descripción',
                            createdAt: 'Creación',
                            type: 'Tipo',
                            isAssigned: 'Asignado'
                        }}
                        selectionable={false}
                        whenDropdown={role ? null : (permission) => <PermissionDetails permission={permission} />}
                    />
                    : <Empity icon='shield' message='No hay permisos registrados en el sistema' />
                }
            </div>
        </div>
    )
}

export default Permissions
