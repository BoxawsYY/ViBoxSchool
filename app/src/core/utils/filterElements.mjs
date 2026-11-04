import { $ } from './selectors.mjs'

export function filterElements(filter, context, element) {
    context = $(context)
    filter = filter.toUpperCase()
    let elements = context.querySelectorAll(element)
    for (let i = 0; i < elements.length; i++) {
        let value = elements[i].textContent || elements[i].innerText
        value.toUpperCase().indexOf(filter) > -1
            ? elements[i].style.display = ""
            : elements[i].style.display = "none"
    }
}

export default filterElements