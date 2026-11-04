import './Loader.css'

const Loader = ({ loading = true, color = 'auto', background = 'primary', animated = true }) => {
    return (<>
        <div className={`lx-c-loader ${loading ? '--active' : '--inactive'} --${background} ${animated ? '--animated' : '--static'}`}>
            <div className={`lx-c-loader-spinner --${color}`} />
        </div>
    </>)
}

export default Loader