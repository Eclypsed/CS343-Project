import CurrencyManager, { type CurrencyDBEntry } from '@lib/currency'

const tableRowTemplate = document.createElement('template')
tableRowTemplate.innerHTML = `
    <tr>
        <td>
            <span id="code" class="badge badge-sm badge-outline font-mono !text-[.6rem] font-bold tracking-widest opacity-50"></span>
        </td>
        <td id="name"></td>
        <td>
            <input type="checkbox" class="toggle toggle-sm toggle-accent" />
        </td>
    </tr>
`

const tableSectionTemplate = document.createElement('template')
tableSectionTemplate.innerHTML = `
    <thead>
        <tr>
            <th></th>
            <th></th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        
    </tbody>
`

const template = document.createElement('template')
template.innerHTML = `
    <table class="table table-sm table-zebra table-pin-rows"></table>
`

class CurrencyTable extends HTMLElement {
    constructor() {
        super()
        this.appendChild(template.content.cloneNode(true))

        const table = this.querySelector<HTMLTableElement>('table')!

        CurrencyManager.getAllCurrencies().then((currencies) => {
            const groups = this.groupAlphabetically(currencies)

            Object.entries(groups).forEach(([letter, currencies]) => table.appendChild(this.buildSection(letter, currencies)))
        })
    }

    private groupAlphabetically = (currencies: CurrencyDBEntry[]): Record<string, CurrencyDBEntry[]> => {
        const letterGroups: Record<string, CurrencyDBEntry[]> = {}

        currencies.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        currencies.forEach((currency) => {
            const firstLetter = currency.name[0].toUpperCase()

            if (!letterGroups[firstLetter]) letterGroups[firstLetter] = []

            letterGroups[firstLetter].push(currency)
        })

        return letterGroups
    }

    private buildSection = (header: string, currencies: CurrencyDBEntry[]): Node => {
        const section = tableSectionTemplate.content.cloneNode(true) as DocumentFragment
        const th = section.querySelector<HTMLTableCellElement>('th')!
        th.textContent = header

        const body = section.querySelector<HTMLTableSectionElement>('tbody')!
        currencies.forEach((currency) => body.appendChild(this.buildRow(currency)))
        return section
    }

    private buildRow = (currency: CurrencyDBEntry): Node => {
        const row = tableRowTemplate.content.cloneNode(true) as DocumentFragment

        const codeCell = row.querySelector<HTMLSpanElement>('#code')!
        codeCell.textContent = currency.code

        const nameCell = row.querySelector<HTMLTableCellElement>('#name')!
        nameCell.textContent = currency.name

        const toggle = row.querySelector<HTMLInputElement>('input[type="checkbox"]')!
        toggle.name = currency.name
        toggle.checked = currency.enabled
        toggle.onchange = () => CurrencyManager.setCurrencyEnabled(currency.code, toggle.checked)

        return row
    }

    public static define() {
        customElements.define('currency-table', CurrencyTable)
    }
}

export default CurrencyTable
