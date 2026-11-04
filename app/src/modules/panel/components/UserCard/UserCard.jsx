import './UserCard.css'
import { dateCountdown } from '../../../../core/utils/dateCountdown.mjs'
import Button from '../../../../core/components/Button/Button'
import Icon from '../../../../core/components/Icon/Icon'
import Switch from '../../../../core/components/Switch/Switch'
import SatatusTag from '../../../../core/components/StatusTag/StatusTag'
import Tooltip from '../../../../core/components/Tooltip/Tooltip'

const UserCard = ({ user, onDelete = () => {}, onAuthorization = () => {}, onRoles = () => {}, onView = () => {} }) => {

    const {
        name = '',
        username = '',
        roles = [],
        isAuthorized,
        isOnline,
        image,
        registerDate,
        lastLogin
    } = user

    const icons = { Admin: 'manage_accounts', User: 'person_check', Guest: 'person', Veterinarian: 'person_heart', Operator: 'person_apron'}

    return (<div className={`lx-c-user-card --${isAuthorized ? 'active' : 'inactive'} --${isOnline ? 'online' : 'offline'}`} onClick={() => onView(user)}>
        <div className='lx-c-user-card-header'>
            <div className='lx-c-user-card-header-online'>
                <SatatusTag status={isOnline} message={isOnline ? 'Online' : 'Offline'} />
            </div>
            <div className='lx-c-user-card-header-switch'>
                <Tooltip content={isAuthorized ? 'Desautorizar' : 'Autorizar'}>
                    <Switch checked={isAuthorized} action={() => onAuthorization(user)} />
                </Tooltip>
            </div>
        </div>
        <div className='lx-c-user-card-head'>
            <div className='lx-c-user-card-head-avatar'>
                {image 
                ? <img src={image} className='--image' /> 
                : <div className='--chars'>{name.slice(0, 2).toUpperCase()}</div>}
            </div>
        </div>
        <div className='lx-c-user-card-content'>
            <div className='lx-c-user-card-content-info'>
                <div className='head'>
                    <div className='--roles'>{roles.length > 0 ? roles.map(role => <span className='---role'>{role.alias}</span>) : 'Sin roles'}</div>
                    <div className='--name'>{name}</div>
                    <div className='--username'>@{username}</div>
                </div>
            </div>
            <div className='body'>
                <span className='--tag'><Icon name='person_shield' size='s'/> {roles.length ? `${roles.length} roles asignados` : 'Sin roles'}</span>
                <span className='--tag'><Icon name='docs' size='s'/> {registerDate ? `Registrado ${dateCountdown(registerDate).toLowerCase()}` : 'Nuevo'}</span>
                <span className='--tag'><Icon name='login' size='s'/> {lastLogin ? `Último login ${dateCountdown(lastLogin).toLowerCase()}` : 'Sin login'}</span>
            </div>
            <div className='footer'>
                <Button size='s' color='auto' width='full' onClick={() => onView(user)}><Icon name='visibility' /> Detalles</Button>
                <Button size='s' color='auto' width='full' variant='bordered' onClick={() => onRoles(user)}><Icon name='shield_person' /> Roles</Button>
                <Button size='s' color='danger' variant='dimed' icon onClick={() => onDelete(user)}><Icon name='delete' /></Button>
            </div>
        </div>
    </div>)
}

export default UserCard