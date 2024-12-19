interface AlertDetail {
    type: 'alert-info' | 'alert-warning' | 'alert-success' | 'alert-error'
    message: string
}

class AlertEvent extends CustomEvent<AlertDetail> {
    constructor(detail: AlertDetail) {
        super('alert', { detail })
    }
}

const alertTemplate = document.createElement('template')
alertTemplate.innerHTML = `
    <div class="alert">
        <span></span>
    </div>
`

class Alert extends HTMLElement {
    constructor(alertDetail: AlertDetail) {
        super()
        this.appendChild(alertTemplate.content.cloneNode(true))

        const outer = this.querySelector<HTMLDivElement>('div')!
        outer.classList.add(alertDetail.type)

        const message = this.querySelector<HTMLSpanElement>('span')!
        message.textContent = alertDetail.message
    }
}

const alertBoxTemplate = document.createElement('template')
alertBoxTemplate.innerHTML = `
    <div id="alert-box" class="toast toast-top toast-end"></div>
`

class AlertBox extends HTMLElement {
    private readonly alertBox: HTMLDivElement

    constructor() {
        super()
        this.appendChild(alertBoxTemplate.content.cloneNode(true))
        this.alertBox = this.querySelector<HTMLDivElement>('#alert-box')!
    }

    public add = (alertDetail: AlertDetail) => {
        const alert = new Alert(alertDetail)
        this.alertBox.appendChild(alert)
        setTimeout(() => alert.remove(), 7000)
    }

    public static define() {
        customElements.define('alert-element', Alert)
        customElements.define('alert-box', AlertBox)
    }
}

export default AlertBox
export { AlertEvent, type AlertDetail }
