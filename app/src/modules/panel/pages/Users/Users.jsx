import './Users.css'
import { useState, useEffect, useCallback } from 'react'
import { useSync } from '../../../../core/hooks/useSync'
import { useLoad } from '../../../../core/hooks/useLoad'
import AuthRequester from '../../services/AuthRequester.mjs'
import Loader from '../../../../core/components/Loader/Loader'
import TabGroup from '../../../../core/components/TabGroup/TabGroup'
import Icon from '../../../../core/components/Icon/Icon'
import UserCards from '../../components/UserCards/UserCards.jsx'
import UserTable from '../../components/UserTable/UsersTable.jsx'
import Footer from '../../../../core/components/Footer/Footer'
import Modal from '../../../../core/components/Modal/Modal'
import UserDetails from '../../components/UserDetails/UserDetails.jsx'
import UserDeleteForm from '../../components/UserDeleteForm/UserDeleteForm.jsx'
import AssignRoles from '../../components/AssignRoles/AssignRoles.jsx'

const Users = () => {
    const [mode, setMode] = useState(null)
    const [tab, setTab] = useState('users')
    const [user, setUser] = useState(null)
    const { state: users, set: setUsers, sync: syncUsers } = useSync()
    const { state: roles, set: setRoles } = useSync()
    const { loading, withLoad } = useLoad(true)

    const load = useCallback(() => withLoad(async () => {
        const users = await AuthRequester.getUsers()
        const roles = await AuthRequester.getRoles()
        setUsers(users ?? [])
        setRoles(roles ?? [])
    }), [withLoad, setUsers, setRoles])

    useEffect(() => {
        load()
    }, [load])

    const reset = () => {
        setMode(null)
        setUser(null)
    }

    const onDelete = async (user) => {
        setUser(user)
        setMode('delete')
    }

    const onRoles = (user) => {
        setUser(user)
        setMode('assign')
    }

    const onView = (user) => {
        setUser(user)
        setMode('view')
    }

    const onAuthorization = async (user) => {
        const updatedUser = user.isAuthorized ? await AuthRequester.disauthorizeUser(user) : await AuthRequester.authorizeUser(user)
        if (!updatedUser.error) {
            syncUsers(updatedUser, 'update')
            setUser(updatedUser)
        }
    }

    const onRole = async (user, role) => {
        const isAssigned = user.roles.some(ur => ur.id === role.id)
        let result = null
        if (isAssigned) {
            result = await AuthRequester.revokeRoleFromUser(user, role)
            if (result) {
                user.roles = user.roles.filter(ur => ur.id !== role.id)
            }
        }
        else {
            result = await AuthRequester.assignRoleToUser(user, role)
            if (result) {
                user.roles.push(role)
            }
        }
        syncUsers(user, 'update')
    }

    const userDeleteFormHandler = (result) => {
        syncUsers(result, 'delete')
        reset()
    }

    return (<>
        <div className='lx-p-users'>
            <Loader loading={loading} background='special' />
            <div className='lx-p-users-header'>
                <div className='info'>
                    <h1 className='--name'>Usuarios</h1>
                    <p className='--description'>Administre las cuentas de usuarios del sistema</p>
                    <div className='--overview'>
                        <div className='summary'>
                            {users.length} usuarios registrados
                        </div>
                    </div>
                </div>
            </div>
            <div className='lx-p-users-content'>
                <div className='lx-p-users-actions'>
                    <TabGroup
                        tabs={[
                            <>Tarjetas <Icon name='square' /></>,
                            <>Tabla <Icon name='table' /></>
                        ]}
                        options={['users', 'roles']}
                        onClick={(option) => {
                            setTab(option)
                        }}
                    />
                </div>
                <div className='lx-p-users-container'>
                    {tab === 'users' && (
                        <div className='lx-p-users-cards'>
                            {
                                <UserCards
                                    users={users}
                                    onDelete={onDelete}
                                    onAuthorization={onAuthorization}
                                    onRoles={onRoles}
                                    onView={onView}
                                />
                            }
                        </div>
                    )}
                    {tab === 'roles' && (
                        <div className='lx-p-users-table'>
                            {
                                <UserTable
                                    users={users}
                                    onView={onView}
                                />
                            }
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>

        <Modal
            show={mode === 'view'}
            title='Detalles de usuario'
            size='large'
            position='right'
            onClose={reset}
            children={
                <UserDetails user={user} onAuthorization={onAuthorization} onDelete={onDelete} onRoles={onRoles} />
            }
        />

        <Modal
            show={mode === 'assign'}
            title='Asignación de roles'
            size='large'
            position='center'
            onClose={reset}
            children={
                <AssignRoles
                    roles={roles}
                    user={user}
                    onRole={onRole}
                />
            }
        />

        <Modal
            show={mode === 'delete'}
            title='Eliminar usuario'
            size='min'
            position='center'
            onClose={reset}
            children={
                <UserDeleteForm
                    user={user}
                    onCancel={reset}
                    handler={userDeleteFormHandler}
                />
            }
        />

    </>)
}

export default Users