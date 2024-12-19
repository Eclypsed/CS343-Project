import CurrencyManager from '@lib/currency'

const template = document.createElement('template')
template.innerHTML = `
    <button class="btn btn-primary">Refresh Exchange Rates</button>
`

class RefreshExchangeRatesButton extends HTMLElement {
    private readonly button: HTMLButtonElement
    public onrefresh: (() => any) | null = null
    public onfail: (() => any) | null = null

    constructor() {
        super()
        this.appendChild(template.content.cloneNode(true))

        this.button = this.querySelector('button')!
        this.button.onclick = this.handleClick
    }

    private handleClick: GlobalEventHandlers['onclick'] = async () => {
        this.button.disabled = true
        this.button.innerHTML = `
            <span class="loading loading-spinner"></span>
            Refreshing
        `
        try {
            await CurrencyManager.refreshExchangeRates()
            this.onrefresh?.call(null)
        } catch {
            this.onfail?.call(null)
        }
        this.button.innerText = `Refresh Exchange Rates`
        this.button.disabled = false
    }

    public static define(): void {
        customElements.define('refresh-exchange-rates-button', RefreshExchangeRatesButton)
    }
}

export default RefreshExchangeRatesButton
