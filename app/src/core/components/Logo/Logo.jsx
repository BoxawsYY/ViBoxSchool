import './Logo.css'

function Logo({ size, color, href, className }) {

    const _color = `var(--lx-color-${['accent', 'auto', 'ghost', 'black', 'white', 'gray', 'success', 'warning', 'danger'].includes(color) ? color : 'accent'})`

    function click(href) {
        if (href) console.log(href)
    }

    return (
        <>
            <div className={`lx-c-logo lx-c-logo-size-${['xxxs', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].includes(size) ? size : 'm'}`} onClick={() => { click(href) }}>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                    width="1000.000000pt" height="1000.000000pt" viewBox="0 0 1000.000000 1000.000000"
                    preserveAspectRatio="xMidYMid meet">

                    <g transform="translate(0.000000,1000.000000) scale(0.100000,-0.100000)"
                        fill={_color} stroke="none">
                        <path d="M2000 8000 l0 -2000 -1000 0 -1000 0 0 -3000 0 -3000 3000 0 3000 0
2 997 3 998 1998 3 1997 2 0 3000 0 3000 -997 2 -998 3 -3 998 -2 997 -3000 0
-3000 0 0 -2000z m6000 -2000 l0 -2000 -997 2 -998 3 -3 997 -2 998 -998 2
-997 3 -3 985 c-1 542 0 991 3 998 3 9 413 12 2000 12 l1995 0 0 -2000z
m-4000 -1000 l0 -1000 -1000 0 -1000 0 0 1000 0 1000 1000 0 1000 0 0 -1000z
m2000 -2000 l0 -1000 -997 2 -998 3 -3 985 c-1 542 0 991 3 998 3 9 213 12
1000 12 l995 0 0 -1000z"/>
                    </g>
                </svg>
            </div>
        </>
    )
}

export default Logo
