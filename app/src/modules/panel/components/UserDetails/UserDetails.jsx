import Button from '../../../../core/components/Button/Button'
import Icon from '../../../../core/components/Icon/Icon'
import SatatusTag from '../../../../core/components/StatusTag/StatusTag'
import Switch from '../../../../core/components/Switch/Switch'
import Tooltip from '../../../../core/components/Tooltip/Tooltip'
import './UserDetails.css'

const Item = ({ icon, name, content }) => {
    return (
        <div className='item'>
            <div className='--icon'>
                <Icon name={icon} />
            </div>
            <div className='--name'>
                {name}
            </div>
            <div className='--content'>
                {content}
            </div>
        </div>
    )
}

const Details = ({ name, items = [] }) => {
    return (
        <div className='lx-c-user-details-details'>
            <div className='--name'>{name}</div>
            <div className='lx-c-user-details-items'>
                {items.map((item, i) => <Item key={`user-detail-${name}-${i}`} icon={item.icon} name={item.name} content={item.content} />)}
            </div>
        </div>
    )
}

const UserDetails = ({ user, onDelete = () => { }, onAuthorization = () => { }, onRoles = () => { } }) => {

    const {
        image = '',
        name = '',
        username = '',
        isOnline,
        isAuthorized,
        lastLogin,
        registerDate,
        documentType,
        documentNumber,
        phoneNumber = 'Sin teléfono',
        email = 'Sin correo',
        gender = 'No especifica',
        birthdate,
        country = 'Sin país',
        city = 'Sin ciudad',
        address = 'Dirección',
        roles = [],
    } = user || {}

    const details = [
        {
            name: 'Información Personal',
            items: [
                {
                    icon: 'signature',
                    name: 'Nombre',
                    content: name
                },
                {
                    icon: 'alternate_email',
                    name: 'Usuario',
                    content: `@${username}`
                },
                {
                    icon: 'id_card',
                    name: 'Documento',
                    content: `${documentType || ''} ${documentNumber || 'Sin documento'}`
                },
                {
                    icon: 'male',
                    name: 'Género',
                    content: gender
                },
                {
                    icon: 'event',
                    name: 'Cumpleaños',
                    content: birthdate ? new Date(birthdate).toLocaleDateString() : 'Sin cumpleaños'
                }
            ]
        },
        {
            name: 'Información de Contacto',
            items: [
                {
                    icon: 'mail',
                    name: 'Correo',
                    content: <div className='lx-tag'>{email}</div>
                },
                {
                    icon: 'phone',
                    name: 'Teléfono',
                    content: <div className='lx-tag'>{phoneNumber}</div>
                },
                {
                    icon: 'flag',
                    name: 'País',
                    content: country
                },
                {
                    icon: 'distance',
                    name: 'Ciudad',
                    content: city
                },
                {
                    icon: 'my_location',
                    name: 'Dirección',
                    content: address
                },
            ]
        },
        {
            name: 'Información de la Cuenta',
            items: [
                {
                    icon: 'bolt',
                    name: 'Online',
                    content: isOnline ? 'Conectado' : 'Desconectado'
                },
                {
                    icon: 'verified',
                    name: 'Autorización',
                    content: isAuthorized ? 'Autorizado' : 'Desautorizado'
                },
                {
                    icon: 'docs',
                    name: 'Registro',
                    content: registerDate ? new Date(registerDate).toLocaleDateString() : 'Sin registro'
                },
                {
                    icon: 'login',
                    name: 'Login',
                    content: lastLogin ? new Date(lastLogin).toLocaleString() : 'Sin login'
                },
                {
                    icon: 'shield_person',
                    name: 'Roles',
                    content: `${roles.length || 0} asignados`
                }
            ]
        }
    ]

    return (
        <div className={`lx-c-user-details ${isOnline && '--online'}`}>
            <div className='lx-c-user-details-head'>
                <div className='lx-c-user-details-avatar'>
                    {image
                        ? <img className='--image' src={image} />
                        : <div className='--chars'>{name.slice(0, 2) || '?'}</div>
                    }
                </div>
                <div className='lx-c-user-details-info'>
                    <div>
                        <div className='--name'>
                            <span className='---content'>{name}</span>
                            <SatatusTag status={isOnline} message={isOnline ? 'Online' : 'Offline'} />
                            <div className='--authorized'>
                                <Icon size='s' name={isAuthorized ? 'verified' : 'verified_off'} />
                                {isAuthorized ? 'Autorizado' : 'Desautorizado'}
                            </div>
                        </div>
                        <div className='--username'>@{username}</div>
                    </div>
                    <div className='--actions'>
                        <Button size='xs' radius='xs' color='auto' variant='bordered' onClick={() => onRoles(user)}>
                            <Icon name='shield_person' />
                            Asignar roles
                        </Button>
                        <Button size='xs' radius='xs' color='danger' variant='solid' onClick={() => onDelete(user)}>
                            <Icon name='delete' />
                            Eliminar
                        </Button>
                    </div>
                </div>
                <div className='lx-c-user-details-switch'>
                    <Tooltip content={isAuthorized ? 'Desautorizar' : 'Autorizar'}>
                        <Switch checked={isAuthorized} action={() => onAuthorization(user)} />
                    </Tooltip>
                </div>
            </div>
            <div className='lx-c-user-details-content'>
                {details.map((d, i) => <Details key={`user-details-${i}`} name={d.name} items={d.items} />)}
            </div>
        </div>
    )
}

export default UserDetails