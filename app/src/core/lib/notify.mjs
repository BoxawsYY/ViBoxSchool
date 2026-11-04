import { $ } from '../utils/selectors.mjs'
import * as novato from '../utils/novato.mjs'

function playBeep(type) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    let duration = 1
    const freq = {
        info: 720,
        warning: 300,
        error: 150,
        success: 880
    }

    oscillator.type = 'sine'
    oscillator.frequency.value = freq[type] || 440
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
}

const readTime = (message) => {
  const time = Math.ceil((message.trim().split(/\s+/).length / 100) * 50 * 1000)
  return time < 6000 ? 6000 : time;
}

export class Notify {

    static notifies = []

    static async notice(message, type = 'info', duration) {
        let notify = {
            'id': `notify-${novato.UUID()}`,
            'type': ['info', 'success', 'warning', 'error'].includes(type) ? type : 'info',
            'message': message,
            'height': 60
        }
        let notifyCard = document.createElement('div')
        notifyCard.classList.add('notify-card')
        notifyCard.classList.add(`notify-card-${notify.type}`)
        notifyCard.setAttribute('id', notify.id)
        notifyCard.innerHTML = `<div class="notify-card-icon">
                <span class="material-symbols-rounded" translate="no" aria-hidden="true">${{ info: 'info', warning: 'warning', success: 'check_circle', error: 'error' }[notify.type]}</span>
            </div>
            <div class="notify-card-message">${notify.message}</div>
        `
        notifyCard.style.top = this.notifies.reduce((first, second) => first + second.height + 10, 0) + 20 + 'px'
        notifyCard.style.setProperty(('--notify-card-animation-duration'), `${(duration || readTime(notify.message)) / 1000}s`)
        notifyCard.addEventListener('click', () => {
            this.closeNotify(notify.id)
        })
        document.body.appendChild(notifyCard)
        notify.height = $(notify.id).offsetHeight
        this.notifies.push(notify)
        new Promise((resolve) =>
            setTimeout(() => {
                this.closeNotify(notify.id)
                resolve()
            }, (duration || readTime(notify.message))))
        return notify
    }

    static async closeNotify(id) {
        let notifyCard = null
        if (this.notifies.length > 0) {
            this.notifies.forEach(function (notify) {
                if (id == notify.id) {
                    if ($(notify.id) != null) {
                        notifyCard = $(id)
                        notifyCard.classList.add('notify-card-out')
                    }
                }
            })
            await new Promise((resolve) =>
                setTimeout(() => {
                    resolve()
                }, 1000))
            if (notifyCard != null) {
                notifyCard.remove()
            }
            this.notifies = this.notifies.filter(fil => fil.id != id)
            this.resizeNotifies()
        }
    }

    static async resizeNotifies() {
        if (this.notifies.length > 0) {
            this.notifies.forEach((notify, index) => {
                const notifyElement = document.getElementById(notify.id)
                if (notifyElement != null) {
                    const newTop = this.notifies.slice(0, index).reduce((acc, prevNotify) => acc + prevNotify.height + 10, 20)
                    notifyElement.style.top = `${newTop}px`
                }
            })
        }
    }

}

export default Notify