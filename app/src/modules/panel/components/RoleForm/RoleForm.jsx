import './RoleForm.css'
import { useForm } from '../../../../core/hooks/useForm'
import Validator from '../../../../core/utils/validator.mjs'
import Button from '../../../../core/components/Button/Button'
import InputGroup from '../../../../core/components/InputGroup/InputGroup'
import Input from '../../../../core/components/Input/Input'
import Textarea from '../../../../core/components/Textarea/Textarea'
import AuthRequester from '../../services/AuthRequester.mjs'

const RoleForm = ({ role, onCancel = () => { }, handler = (result) => { } }) => {
    const {
        form,
        setForm,
        resetForm,
        errors,
        setErrors,
        handleChange
    } = useForm(role || {
        name: '',
        alias: '',
        description: ''
    })

    const validator = new Validator({ prefix: 'Role', errorHandler: setErrors })

    const validate = () => {
        const { name, description, alias } = form
        return validator.every([
            ['Name', () => validator.set({ name }).required().length(2, 100)],
            ['Alias', () => validator.set({ alias }).required().length(2, 100)],
            ['Description', () => validator.set({ description }).required().length(1, 500)],
        ], 'RoleForm')
    }

    const submit = async (event) => {
        event.preventDefault()

        if (!validate()) return

        const result = role
            ? await AuthRequester.updateRole(form)
            : await AuthRequester.createRole(form)

        if (result) {
            handler(result)
        }
    }

    return (<form className='lx-f-role'>

        <InputGroup>
            <Input
                required
                id='RoleName'
                name='name'
                label='Nombre'
                type='text'
                autoComplete='off'
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                disabled={!!role}
            />
            <Input
                required
                id='RoleAlias'
                name='alias'
                label='Alias'
                type='text'
                autoComplete='off'
                minLength={2}
                maxLength={100}
                value={form.alias}
                onChange={handleChange}
                error={errors.alias}
            />
            <Textarea
                required
                id='RoleDescription'
                name='description'
                label='Descripción'
                type='text'
                autoComplete='off'
                minLength={2}
                maxLength={100}
                value={form.description}
                onChange={handleChange}
                error={errors.description}
            />
        </InputGroup>
        <div className='lx-f-role-actions'>
            <Button variant='bordered' color='auto' width='full' onClick={onCancel}>Cancelar</Button>
            <Button width='full' onClick={submit}>{role ? 'Guardar cambios' : 'Crear rol'}</Button>
        </div>
    </form>)
}

export default RoleForm