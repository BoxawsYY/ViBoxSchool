import './Authorization.css'
import { useState, useEffect, useCallback } from 'react'
import { useSync } from '../../../../core/hooks/useSync'
import { useLoad } from '../../../../core/hooks/useLoad'
import AuthRequester from '../../services/AuthRequester.mjs'
import Loader from '../../../../core/components/Loader/Loader'
import TabGroup from '../../../../core/components/TabGroup/TabGroup'
import Icon from '../../../../core/components/Icon/Icon'
import Permissions from '../../components/Permissions/Permissions'
import Roles from '../../components/Roles/Roles'
import Footer from '../../../../core/components/Footer/Footer'
import Modal from '../../../../core/components/Modal/Modal'
import Button from '../../../../core/components/Button/Button'
import RoleForm from '../../components/RoleForm/RoleForm'
import RoleDeleteForm from '../../components/RoleDeleteForm/RoleDeleteForm'

const Authorization = () => {
    const [mode, setMode] = useState(null)
    const [tab, setTab] = useState('roles')
    const [role, setRole] = useState(null)
    const { state: roles, set: setRoles, sync: syncRoles } = useSync()
    const { state: permissions, set: setPermissions } = useSync()
    const { loading, withLoad } = useLoad(true)

    const load = useCallback(() => withLoad(async () => {
        const roles = await AuthRequester.getRoles()
        const permissions = await AuthRequester.getPermissions()
        setRoles(roles ?? [])
        setPermissions(permissions ?? [])
    }), [withLoad, setRoles, setPermissions])

    useEffect(() => {
        load()
    }, [load])

    const reset = () => {
        setMode(null)
        setRole(null)
    }

    const onEdit = (role) => {
        setRole(role)
        setMode('edit')
    }

    const onDelete = async (role) => {
        setRole(role)
        setMode('delete')
    }

    const onPermissions = (role) => {
        setRole(role)
        setMode('assign')
    }

    const onActivation = async (role) => {
        const updatedRole = role.isActive ? await AuthRequester.deactivateRole(role) : await AuthRequester.activateRole(role)
        if (!updatedRole.error) syncRoles(updatedRole, 'update')
    }

    const onPermission = async (role, permission) => {
        const isAssigned = role.permissions.some(rp => rp.id === permission.id)
        let result = null
        if (isAssigned) {
            result = await AuthRequester.revokePermissionFromRole(role, permission)
            if (result) {
                role.permissions = role.permissions.filter(rp => rp.id !== permission.id)
            }
        }
        else {
            result = await AuthRequester.assignPermissionToRole(role, permission)
            if (result) {
                role.permissions.push(permission)
            }
        }
        syncRoles(role, 'update')
    }

    const roleFormHandler = (result) => {
        syncRoles(result, role ? 'update' : 'create')
        reset()
    }

    const roleDeleteFormHandler = (result) => {
        syncRoles(result, 'delete')
        reset()
    }

    return (<>
        <div className='lx-p-authorization'>
            <Loader loading={loading} background='special' />
            <div className='lx-p-authorization-header'>
                <div className='info'>
                    <h1 className='--name'>Autorización</h1>
                    <p className='--description'>Roles y permisos del sistema</p>
                    <div className='--overview'>
                        <div className='summary'>
                            {tab === 'roles' ? `${roles.length} roles registrados` : `${permissions.length} permisos registrados`}
                        </div>
                    </div>
                </div>
                <div className='actions'>
                    {tab === 'roles' && <Button onClick={() => setMode('create')}>
                        <Icon name='add' />
                        Nuevo rol
                    </Button>}
                </div>
            </div>
            <div className='lx-p-authorization-content'>
                <div className='lx-p-authorization-actions'>
                    <TabGroup
                        tabs={[
                            <>Roles <Icon name='person_shield' /></>,
                            <>Permisos <Icon name='shield' /></>
                        ]}
                        options={['roles', 'permissions']}
                        onClick={(option) => {
                            setTab(option)
                        }}
                    />
                </div>
                <div className='lx-p-authorization-container'>
                    {tab === 'roles' && (
                        <div className='lx-p-authorization-roles'>
                            {
                                <Roles
                                    roles={roles}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onActivation={onActivation}
                                    onPermissions={onPermissions}
                                />
                            }
                        </div>
                    )}
                    {tab === 'permissions' && (
                        <div className='lx-p-authorization-permissions'>
                            <Permissions permissions={permissions} />
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>

        <Modal
            show={['create', 'edit'].includes(mode)}
            title={`${mode === 'create' ? 'Nuevo' : 'Editar'} ${tab === 'roles' ? 'rol' : 'permiso'}`}
            size='min'
            position='center'
            onClose={reset}
            children={
                <RoleForm
                    role={role}
                    onCancel={reset}
                    handler={roleFormHandler}
                />
            }
        />

        <Modal
            show={mode === 'assign'}
            title='Asignación de permisos'
            size='standar'
            position='right'
            onClose={reset}
            children={
                <Permissions
                    permissions={permissions}
                    role={role}
                    onPermission={onPermission}
                />
            }
        />

        <Modal
            show={mode === 'delete'}
            title='Eliminar rol'
            size='min'
            position='center'
            onClose={reset}
            children={
                <RoleDeleteForm
                    role={role}
                    onCancel={reset}
                    handler={roleDeleteFormHandler}
                />
            }
        />

    </>)
}

export default Authorization