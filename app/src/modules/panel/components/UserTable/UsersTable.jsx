import './UserTable.css'
import Table from "../../../../core/components/Table/Table"
import Switch from '../../../../core/components/Switch/Switch'
import SatatusTag from '../../../../core/components/StatusTag/StatusTag'
import { dateCountdown } from '../../../../core/utils/dateCountdown.mjs'

const UserTable = ({ users, onView = () => { } }) => {
    return <Table
        objects={users}
        mapper={(user) => ({
            '': <div className={`lx-c-user-table-avatar ${user.isOnline && '--online'}`}>
                {user.image ? <img className='--image' src={user.image} alt={user.name} /> : <div className='--chars'>{user.name?.slice(0, 2) ?? '?'}</div>}
            </div>,
            name: <div>
                <p className='lx-text-color'>{user.name}</p>
                <p className='lx-text-color-softest'>@{user.username}</p>
            </div>,
            document: <span className='lx-text-color-softer'>{user.documentType || ''} {user.documentNumber || 'Sin documento'}</span>,
            contact: <div className='lx-tags'>
                <span className='lx-tag'>{user.email || 'Sin correo'}</span>
                <span className='lx-tag'>{user.phoneNumber || 'Sin teléfono'}</span>
            </div>,
            birthdate: new Date(user.birthdate).toLocaleDateString(),
            isAuthorized: <span>{user.isAuthorized ? 'Autorizado' : 'Desautorizado'}</span>,
            isOnline: <SatatusTag status={user.isOnline} message={user.isOnline ? 'Online' : 'Offline'} />,
            registerDate: dateCountdown(user.registerDate),
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca',
        })}
        translation={{
            name: 'Nombre',
            username: 'Usuario',
            contact: 'Contacto',
            document: 'Documento',
            birthdate: 'Cumpleaños',
            isOnline: 'Online',
            isAuthorized: 'Autorización',
            registerDate: 'Ingresó',
            lastLogin: 'Último ingreso',
        }}
        selectionable={false}
        onClick={(user) => onView(user)}
    />
}

export default UserTable