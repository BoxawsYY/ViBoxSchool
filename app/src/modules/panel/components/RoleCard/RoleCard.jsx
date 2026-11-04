import './RoleCard.css'
import { dateCountdown } from '../../../../core/utils/dateCountdown.mjs'
import Button from '../../../../core/components/Button/Button'
import Icon from '../../../../core/components/Icon/Icon'
import Switch from '../../../../core/components/Switch/Switch'
import Tooltip from '../../../../core/components/Tooltip/Tooltip'

const RoleCard = ({ role, onEdit = () => {}, onDelete = () => {}, onActivation = () => {}, onPermissions = () => {} }) => {

    const {
        alias = '',
        name = '',
        description = '',
        permissions = [],
        isActive,
        createdAt,
        updatedAt
    } = role

    const icons = { Admin: 'manage_accounts', User: 'person_check', Guest: 'person', Veterinarian: 'person_heart', Operator: 'person_apron'}

    return (<div className={`lx-c-role-card --${isActive ? 'active' : 'inactive'} --${name.toLowerCase()}`}>
        <div className='lx-c-role-card-header'>
            <Icon name={icons[name] || 'person'} size='xxxl' className='lx-c-role-card-header-icon' />
            <div className='lx-c-role-card-header-switch'>
                <Tooltip content={isActive ? 'Desactivar' : 'Activar'}>
                    <Switch checked={isActive} action={() => onActivation(role)} />
                </Tooltip>
            </div>
        </div>
        <div className='lx-c-role-card-content'>
            <div className='lx-c-role-card-content-info'>
                <div className='head'>
                    <div className='--name'>{name}</div>
                    <div className='--alias'>{alias}</div>
                </div>
                <p className='--description'>{description}</p>
            </div>
            <div className='body'>
                <span className='--tag'><Icon name='shield' size='s'/> {permissions.length ? `${permissions.length} permisos asignados` : 'Sin permisos'}</span>
                <span className='--tag'><Icon name='docs' size='s'/> {createdAt ? `Creado ${dateCountdown(createdAt).toLowerCase()}` : 'Nuevo'}</span>
                <span className='--tag'><Icon name='update' size='s'/> {updatedAt ? `Actualizado ${dateCountdown(updatedAt).toLowerCase()}` : 'Sin actualización'}</span>
            </div>
            <div className='footer'>
                <Button size='s' color='auto' width='full' onClick={() => onEdit(role)}><Icon name='edit_note' /> Editar</Button>
                <Button size='s' color='auto' width='full' variant='bordered' onClick={() => onPermissions(role)}><Icon name='shield_toggle' /> Permitir</Button>
                <Button size='s' color='danger' variant='dimed' icon onClick={() => onDelete(role)}><Icon name='delete' /></Button>
            </div>
        </div>
    </div>)
}

export default RoleCard