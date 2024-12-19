import CurrencyManager, { type Currency } from '@lib/currency'

const currencyOptionTemplate = document.createElement('template')
currencyOptionTemplate.innerHTML = `
    <li>
        <button>
            <span id="badge" class="badge badge-sm badge-outline font-mono !text-[.6rem] font-bold tracking-widest opacity-50"></span>
            <span id="currency-name" class="text-nowrap line-clamp-1 overflow-ellipsis text-sm font-sans text-neutral-content"></span>
        </button>
    </li>
`

class CurrencyOption extends HTMLElement {
    public readonly currency: Currency
    private readonly optionButton: HTMLButtonElement

    constructor(currency: Currency) {
        super()
        this.appendChild(currencyOptionTemplate.content.cloneNode(true))

        this.currency = currency
        this.optionButton = this.querySelector<HTMLButtonElement>('button')!

        this.querySelector<HTMLSpanElement>('#badge')!.innerText = this.currency.code
        this.querySelector<HTMLSpanElement>('#currency-name')!.innerText = this.currency.name
    }

    public set active(active: boolean) {
        active ? this.optionButton.classList.add('active') : this.optionButton.classList.remove('active')
    }

    public set onclick(handler: GlobalEventHandlers['onclick']) {
        this.optionButton.onclick = handler
    }
}

interface CurrencyChangeEventDetail {
    newCurrencyCode: string
}

class CurrencyChangeEvent extends CustomEvent<CurrencyChangeEventDetail> {
    constructor(detail: CurrencyChangeEventDetail) {
        super('currencyChanged', { detail })
    }
}

const currencySelectorTemplate = document.createElement('template')
currencySelectorTemplate.innerHTML = `
    <div class="dropdown dropdown-bottom dropdown-end w-full">
        <button class="btn btn-ghost flex-nowrap w-full">
            <span id="active-currency" class="opacity-60"></span>
            <svg
                width="12px"
                height="12px"
                class="hidden h-2 w-2 fill-current opacity-60 sm:inline-block"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 2048 2048"
            >
                <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
            </svg>
        </button>
        <div class="dropdown-content menu menu-sm bg-base-200 rounded-box border-neutral my-2 w-64 border p-2 shadow">
            <ul id="options" class="max-h-96 overflow-y-scroll flex flex-col gap-1"></ul>
        </div>
    </div>`

class CurrencySelector extends HTMLElement {
    private readonly currencyOptions: Map<string, CurrencyOption>
    public oncurrencychange: ((event: CurrencyChangeEvent) => any) | null = null

    constructor() {
        super()
        this.currencyOptions = new Map()
        this.appendChild(currencySelectorTemplate.content.cloneNode(true))
        const currencyOptionList = this.querySelector<HTMLUListElement>('#options')!
        CurrencyManager.getEnabledCurrencies().then((currencies) => {
            currencies.forEach((currency) => {
                const option = this.addCurrencyOption(currency)
                currencyOptionList.appendChild(option)
            })
            this.updateActiveCurrency(CurrencyManager.activeCurrency)
        })
    }

    private addCurrencyOption(currency: Currency): CurrencyOption {
        const option = new CurrencyOption(currency)
        option.onclick = () => this.updateActiveCurrency(currency.code)
        option.active = currency.code === CurrencyManager.activeCurrency
        this.currencyOptions.set(currency.code, option)

        return option
    }

    private updateActiveCurrency(currencyCode: string) {
        const newOption = this.currencyOptions.get(currencyCode)

        if (!newOption) return

        this.currencyOptions.forEach((option) => (option.active = false))

        CurrencyManager.activeCurrency = currencyCode

        newOption.active = true

        const activeCurrency = this.querySelector<HTMLSpanElement>('#active-currency')!
        activeCurrency.innerText = currencyCode

        if (this.oncurrencychange) {
            this.oncurrencychange(new CurrencyChangeEvent({ newCurrencyCode: currencyCode }))
        }
    }

    public static define() {
        customElements.define('currency-option', CurrencyOption)
        customElements.define('currency-selector', CurrencySelector)
    }
}

export default CurrencySelector
