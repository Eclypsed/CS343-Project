import TanocStore from '@lib/tanocStore'
import CurrencyManager from '@lib/currency'
import ProductManager from '@lib/products'

/* Web Components */
import ProductCard from '@lib/components/productCard'
import TanocStoreLogo from '@lib/components/tanocStoreLogo'
import CurrencySelector from '@lib/components/currencySelector'
import ProductSearchModal from '@lib/components/productSearchModal'
import AlertBox, { AlertEvent } from '@lib/components/alertBox'

AlertBox.define()
ProductCard.define()
TanocStoreLogo.define()
CurrencySelector.define()
ProductSearchModal.define()
/* Web Components */

const productMap = new Map<string, ProductCard>()

const cardWrapper = document.querySelector<HTMLElement>('#card-wrapper')!

const alerBox = document.querySelector<AlertBox>('alert-box')!

const currencySelector = document.querySelector<CurrencySelector>('currency-selector')!
currencySelector.oncurrencychange = (event) => convertProductPrices(event.detail.newCurrencyCode, Array.from(productMap.values()))

const productSearchModal = document.querySelector<ProductSearchModal>('product-search-modal')!
productSearchModal.addEventListener('alert', ((event: AlertEvent) => alerBox.add(event.detail)) as EventListener)
productSearchModal.onadd = constructCard

const addProductButton = document.querySelector<HTMLButtonElement>('#add-product-button')!
addProductButton.onclick = productSearchModal.open

const exportProductsButton = document.querySelector<HTMLButtonElement>('#export-products-button')!
exportProductsButton.onclick = () => exportProducts(Array.from(productMap.values(), (card) => card.product))

function constructCard(product: Product): ProductCard {
    const card = new ProductCard(product)
    productMap.set(product.id, card)
    cardWrapper.appendChild(card)
    return card
}

async function convertProductPrices(currencyCode: string, products: ProductCard[]) {
    const newCurrency = await CurrencyManager.getCurrency(currencyCode)
    async function exchangeProductCurrency(productCard: ProductCard) {
        const exchangeRate = await CurrencyManager.getExchangeRate(productCard.product.price.currency, currencyCode)

        if (!newCurrency || !exchangeRate) throw Error('Failed to find exchange rate')

        return productCard.convertCurrency(newCurrency, exchangeRate)
    }

    await Promise.all(products.map(exchangeProductCurrency))
}

function exportProducts(products: Product[]) {
    const blob = new Blob([JSON.stringify({ products })], { type: 'text/plain' })
    const objectURL = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectURL
    link.download = 'products.json'
    link.click()
    URL.revokeObjectURL(objectURL)
    link.remove()
}

/* Initialization */
ProductManager.products.forEach((id) => TanocStore.product(id).then(constructCard))
