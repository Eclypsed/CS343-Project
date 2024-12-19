import ThemeManager from '@lib/themes'

/* Web Components */
import AlertBox from '@lib/components/alertBox'
import CurrencyTable from '@lib/components/currencyTable'
import TanocStoreLogo from '@lib/components/tanocStoreLogo'
import RefreshExchangeRatesButton from '@lib/components/refreshExchangeRatesButton'

AlertBox.define()
CurrencyTable.define()
TanocStoreLogo.define()
RefreshExchangeRatesButton.define()
/* Web Components */

const alertBox = document.querySelector<AlertBox>('alert-box')!

const refreshExchangeRatesButton = document.querySelector<RefreshExchangeRatesButton>('refresh-exchange-rates-button')!
refreshExchangeRatesButton.onrefresh = () => alertBox.add({ message: 'Refreshed exchange rates', type: 'alert-success' })
refreshExchangeRatesButton.onfail = () => alertBox.add({ message: 'Failed to refresh exchange rates', type: 'alert-error' })

const themeButtons = document.querySelectorAll<HTMLInputElement>('input[name="theme-buttons"]')!
themeButtons.forEach((button) => {
    if (button.value === ThemeManager.activeTheme) {
        button.checked = true
    }

    button.onchange = () => {
        if (button.checked && ThemeManager.validTheme(button.value)) {
            ThemeManager.activeTheme = button.value
        }
    }
})
