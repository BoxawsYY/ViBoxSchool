export function clipboard(textToCopy) {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            const successful = document.execCommand("copy");
        } catch (err) {
            console.error("Error al copiar contenido:", err);
        }
        document.body.removeChild(textArea);
}