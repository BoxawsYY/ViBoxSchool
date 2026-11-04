class Color {

    static getCakeHSL() {
        let h = Math.floor(Math.random() * 360)
        return `hsl(${h}deg, 55%, 85%)`
    }

    static getRGB() {
        var r = Math.floor(Math.random() * 256)
        var g = Math.floor(Math.random() * 256)
        var b = Math.floor(Math.random() * 256)
        return `rgb(${r},${g},${b})`
    }

    static getHEX() {
        const hexadecimales = '0123456789ABCDEF'
        let color = '#'
        for (let i = 0; i < 6; i++) {
            color += hexadecimales[Math.floor(Math.random() * 16)]
        }
        return color
    }

}

export default Color