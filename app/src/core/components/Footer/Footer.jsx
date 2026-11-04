import './Footer.css'
import { NavLink } from 'react-router-dom'

const Footer = () => {
    return (<footer className='lx-c-footer'>
        {/* <nav className='lx-c-footer-nav'>
            <NavLink to='/policies/#privacy'>Privacy Policy</NavLink>
            <NavLink to='/policies/#use'>Terms of Use</NavLink>
            <NavLink to='/policies/#localstorage'>Local Storage Policy</NavLink>
            <NavLink to='/policies/#cookies'>Cookie Policy</NavLink>
        </nav>
        <br />
        <p>
            Rewear is just a tech-platform that facilitates clothing exchange for sustainable circular fashion, and <i>not the owner of the garments</i>. 
            As such, Rewear bear no responsibility for the garments, the transaction information, or the transaction itself. 
            All responsibility of the tangible products fall on the <i><b>users who perform the exchange</b></i>.
        </p>
        <br />
        <p>Copyright by Rewear or It's affiliates labels (Rewear Designs, Rewear Development, and others) All rights reserved.</p>
        <br /> */}
        <p><b>©{new Date().getFullYear()} Stepfive. </b>All rights reserved.</p>
    </footer>)
}

export default Footer