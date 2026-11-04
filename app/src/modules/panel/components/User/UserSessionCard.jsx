import './UserSessionCard.css'
import Button from '../../../../core/components/Button/Button'
import { useAuth } from '../../../../core/contexts/AuthContext'
import { dateCountdown } from '../../../../core/utils/dateCountdown.mjs'

const UserSessionCard = ({ onClose = () => { } }) => {
  const { session, signOut } = useAuth()
  const user = session.user || {}

  const {
    name = 'Visistante',
    documentNumber = '',
    username = 'visitante',
    email = 'Sin correo',
    phoneNumber = 'Sin teléfono',
    roles = [],
    gender = '',
    birthdate,
    image,
    createdAt
  } = user

  const avatarChar = name ? name[0] : '?'

  const fields = [
    {
      label: 'Nombre',
      value: name || 'Sin información'
    },
    {
      label: 'Identificación',
      value: documentNumber || 'Sin información'
    },
    {
      label: 'Correo',
      value: email
    },
    {
      label: 'Teléfono',
      value: phoneNumber
    },
    {
      label: 'Género',
      value: gender || 'No especificado'
    },
    {
      label: 'Cumpleaños',
      value: birthdate && new Date(birthdate).toLocaleDateString()
    },
    {
      label: 'Estado',
      value: 'Acitvo'
    }
  ]

  return (
    <div className='lx-c-user-session-card'>
      <div className='lx-c-user-session-card-close'>
        <Button size='xxs' color='white' variant='plain' radius='full' onClick={onClose}>
          <span className='material-symbols-rounded' translate='no'>close</span>
        </Button>
      </div>

      <div className='lx-c-user-session-card-header'>
        <div className='lx-c-user-session-card-header-avatar'>
          <div className='lx-c-user-session-card-header-avatar-char'>
            {image ? <img className='--image' src={image} /> : avatarChar}
          </div>
        </div>
      </div>

      <div className='lx-c-user-session-card-content'>
        <div className='lx-c-user-session-card-content-principal'>
          <span className='lx-c-user-session-card-content-tag'>@{username}</span>
          <h2 className='lx-c-user-session-card-content-fullname'>
            {name}
          </h2>
          <span className='lx-c-user-session-card-content-role'>
            {roles || 'Sin roles'}
          </span>
        </div>

        <div className='lx-c-user-session-card-content-info'>
          {fields.map(({ label, value }) => (
            <div className='lx-c-user-session-card-content-info-item' key={label}>
              <div className='lx-c-user-session-card-content-info-item-key'>{label}</div>
              <div className='lx-c-user-session-card-content-info-item-value'>{value}</div>
            </div>
          ))}

                  <Button size='s' color='danger' radius='full' variant='dimed' onClick={signOut}>
          <span className='material-symbols-rounded' translate='no'>logout</span> Cerrar sesión
        </Button>
        </div>


        {createdAt && <p className='lx-c-user-session-card-created-at'>{dateCountdown(new Date(createdAt))}</p>}
      </div>
    </div>
  )
}

export default UserSessionCard