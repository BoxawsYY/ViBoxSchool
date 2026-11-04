export const REGISTER = {
    FORM: {
        INITIAL: {
            name: '',
            documentType: '',
            documentNumber: '',
            country: '',
            city: '',
            address: '',
            phoneNumber: '',
            email: '',
            username: '',
            password: '',
            repeatPassword: '',
            birthdate: '',
            gender: '',
            image: ''
        }
    },
    OPTIONS: {
        DOCUMENT: [
            {
                key: 'C.C',
                value: 'C.C'
            },
            {
                key: 'T.I',
                value: 'T.I',
            },
            {
                key: 'C.E',
                value: 'C.E'
            },
            {
                key: 'Pasaporte',
                value: 'Pasaporte'
            },
            {
                key: 'NIT',
                value: 'NIT'
            }
        ],
        GENDER: [
            {
                key: 'Masculino',
                value: 'Masculino'
            },
            {
                key: 'Femenino',
                value: 'Femenino'
            },
            {
                key: 'Otros',
                value: 'Otros'
            }
        ]
    }
}