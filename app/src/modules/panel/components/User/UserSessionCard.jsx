import PropTypes from 'prop-types'
import './UserSessionCard.css'
import Button from '../../../../core/components/Button/Button'
import { useAuth } from '../../../../core/contexts/AuthContext'
import { dateCountdown } from '../../../../core/utils/dateCountdown.mjs'

const ROLE_LABELS = {
  Admin: 'Administrador',
  Rector: 'Rector',
  Secretary: 'Secretaría',
  Guardian: 'Padre de Familia'
}

const UserSessionCard = ({ onClose = () => { } }) => {
  const { session, signOut } = useAuth()
  const user = session.user || {}

  const {
    name = 'Visitante',
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

  const getRoleLabels = (roleValue) => {
    const roleList = Array.isArray(roleValue)
      ? roleValue
      : String(roleValue || '').split(/[,\s]+/).filter(Boolean)

    const labels = roleList.map((roleName) => ROLE_LABELS[roleName] || roleName)
    return labels.length > 0 ? labels.join(', ') : 'Sin roles'
  }

  const roleLabel = getRoleLabels(roles)

  const valueOrFallback = (value, fallback = 'Sin información') => {
    if (value === null || value === undefined) return fallback
    const text = String(value).trim()
    return text || fallback
  }

  const formatBirthdate = (date) => {
    const parsedDate = new Date(date)
    return Number.isNaN(parsedDate.getTime()) ? 'Sin información' : parsedDate.toLocaleDateString()
  }

  const fields = [
    {
      label: 'Nombre',
      value: valueOrFallback(name)
    },
    {
      label: 'Identificación',
      value: valueOrFallback(documentNumber)
    },
    {
      label: 'Correo',
      value: valueOrFallback(email)
    },
    {
      label: 'Teléfono',
      value: valueOrFallback(phoneNumber)
    },
    {
      label: 'Género',
      value: valueOrFallback(gender, 'No especificado')
    },
    {
      label: 'Cumpleaños',
      value: birthdate ? formatBirthdate(birthdate) : 'Sin información'
    },
    {
      label: 'Estado',
      value: 'Activo'
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
            {roleLabel}
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

UserSessionCard.propTypes = {
    onClose: PropTypes.func
}

export default UserSessionCard