import './RoleDeleteForm.css'
import Button from '../../../../core/components/Button/Button'
import Icon from '../../../../core/components/Icon/Icon'
import AuthRequester from '../../services/AuthRequester.mjs'

const RoleDeleteForm = ({ role, handler = () => { }, onCancel = () => { } }) => {
    const { name = '' } = role || {}

    const submit = async () => {
        const result = await AuthRequester.deleteRole(role)
        if(result) {
            handler({ id: role.id })
        }
        else {
            onCancel()
        }
    }

    return (<div className='lx-f-role-delete'>
        <div className='icon'>
            <Icon name='warning' size='xxxl' className='lx-text-color-danger' />
        </div>
        <p className='message'>¿Estás seguro de que deseas eliminar el rol <strong>{name}</strong>?</p>
        <div className='actions'>
            <Button size='s' width='full' color='danger' onClick={submit}>Eliminar</Button>
            <Button size='s' width='full' color='auto' variant='bordered' onClick={onCancel}>Cancelar</Button>
        </div>
    </div>)
}

export default RoleDeleteForm