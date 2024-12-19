import type { Currency } from '@lib/currency'
import ProductManager from '@lib/products'

const template = document.createElement('template')
template.innerHTML = `
    <div class="card card-compact bg-base-100 relative">
        <figure class="px-5 pt-5">
            <a id="page-link">
                <img id="image" class="h-full w-full rounded-lg object-cover" />
            </a>
        </figure>
        <div class="card-body items-center text-center !gap-3">
            <div>
                <h2 id="title" class="line-clamp-1 card-title !text-lg"></h2>
                <h3 id="subtitle" class="line-clamp-1 text-sm"></h3>
            </div>
            <div class="card-actions justify-center">
                <div id="stock-amount" class="tooltip tooltip-success">
                    <div id="stock-status" class="badge badge-outline"></div>
                </div>
                <div id="price" class="badge badge-neutral"></div>
            </div>
        </div>
        <div class="tooltip absolute -top-2.5 -right-2.5" data-tip="Delete">
            <button id="delete" class="btn btn-circle btn-sm bg-base-100">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>
`

class ProductCard extends HTMLElement {
    public readonly product: Product
    private readonly priceElement: HTMLDivElement

    constructor(product: Product) {
        super()
        this.product = product
        this.appendChild(template.content.cloneNode(true))

        const pageLink = this.querySelector<HTMLAnchorElement>('#page-link')!
        pageLink.href = `https://www.tanocstore.net/shopdetail/${product.id.padStart(12, '0')}`
        pageLink.target = '_blank'

        const image = this.querySelector<HTMLImageElement>('#image')!
        image.src = this.product.imageUrl.toString()
        image.alt = `${this.product.name} Jacket`

        const title = this.querySelector<HTMLHeadingElement>('#title')!
        title.textContent = this.product.name

        const subtitle = this.querySelector<HTMLHeadingElement>('#subtitle')!
        subtitle.textContent = `${this.product.seller} / ${this.product.modelNumber}`

        if (product.inStock) {
            const stockAmount = this.querySelector<HTMLDivElement>('#stock-amount')!
            stockAmount.dataset.tip = `Stock: ${product.stockAmount}`
        }

        const stockStatus = this.querySelector<HTMLDivElement>('#stock-status')!
        if (this.product.inStock) {
            stockStatus.classList.remove('badge-error')
            stockStatus.classList.add('badge-success')
            stockStatus.textContent = 'In Stock'
        } else {
            stockStatus.classList.remove('badge-success')
            stockStatus.classList.add('badge-error')
            stockStatus.textContent = 'Out of Stock'
        }

        this.priceElement = this.querySelector<HTMLDivElement>('#price')!
        this.priceElement.textContent = `${this.product.price.amount} ${this.product.price.currency}`

        const deleteButton = this.querySelector<HTMLButtonElement>('#delete')!
        deleteButton.onclick = this.delete
    }

    public convertCurrency = (newCurrency: Currency, exchangeRate: number) => {
        const newAmount = this.product.price.amount / exchangeRate
        this.priceElement.textContent = `${newAmount.toFixed(newCurrency.decimal_digits)} ${newCurrency.code}`
    }

    private delete = () => {
        ProductManager.delete(this.product.id)
        this.remove()
    }

    public static define() {
        customElements.define('product-card', ProductCard)
    }
}

export default ProductCard
