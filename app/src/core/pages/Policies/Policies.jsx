import './Policies.css'
import Brand from '../../components/Brand/Brand'
import Footer from '../../components/Footer/Footer'
import Logo from '../../components/Logo/Logo'

const Policies = () => {
    return (
        <div className='lx-p-policies'>
            <div className='lx-p-policies-content'>
                <h1 id="privacy">Política de Privacidad</h1>
                <p>
                    <strong>Rewear</strong> es una plataforma tecnológica que facilita el trueque de ropa para la moda circular sostenible, y no es el propietario de las prendas. Por lo tanto, <strong>Rewear</strong> y Rewear Development Team no asumen ninguna responsabilidad por el estado de las prendas, la información de transacciones de las prendas ni la logística del trueque. La gestión y responsabilidad del envío de los productos tangibles recae exclusivamente en los usuarios que realizan el trueque.
                </p>
                <h1 id="use">Términos de Uso</h1>
                <p>Al utilizar el sitio web de <strong>Rewear</strong>, aceptas cumplir con los siguientes términos y condiciones:</p>
                <ol>
                    <li><p><strong>Responsabilidad Limitada:</strong> <strong>Rewear</strong> actúa únicamente como plataforma facilitadora de trueques y no es responsable de la calidad, el estado o la veracidad de la descripción de las prendas intercambiadas. Cualquier problema con las prendas debe abordarse directamente entre los usuarios que participan en el trueque.</p></li>
                    <li><p><strong>Información de Transacción:</strong> Toda la información relacionada con el trueque se gestiona de manera segura, pero Rewear no almacena información financiera personal de los usuarios.</p></li>
                    <li><p><strong>Envío y Logística:</strong> La gestión y responsabilidad del envío de las prendas corresponde exclusivamente a los usuarios que realizan el trueque.</p></li>
                    <li><p><strong>Uso Apropiado:</strong> Los usuarios deben utilizar la plataforma de manera apropiada, garantizando que las prendas ofrecidas cumplen con los estándares éticos y de uso, y respetar los derechos de propiedad intelectual de terceros.</p></li>
                </ol>

                <h1 id="localstorage">Almacenamiento Local</h1>
                <p><strong>Rewear</strong> utiliza el almacenamiento local en tu dispositivo para mejorar la experiencia del usuario y recordar ciertas preferencias. Puedes controlar el almacenamiento local a través de la configuración de tu navegador o dispositivo.</p>

                <h1 id="cookies">Política de Cookies</h1>
                <p><strong>Rewear</strong> utiliza cookies para brindar una experiencia de usuario más eficiente y personalizada. Al utilizar nuestro sitio web, aceptas el uso de cookies de acuerdo con nuestra Política de Cookies. Puedes gestionar las preferencias de cookies a través de la configuración de tu navegador.</p>
            </div>
            <center><Logo size='xxl' color='auto' /></center>
            <Footer />
        </div>
    )
}

export default Policies