import TanocStore from '@lib/tanocStore'
import ProductManager from '@lib/products'
import { AlertEvent } from './alertBox'

const spinner = `<span class="loading loading-spinner" />`

const searchSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="h-4 w-4" fill="currentColor">
        <!--!Font Awesome Free 6.7.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
        <path
            d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
        />
    </svg>
`

const productPreviewTemplate = document.createElement('template')
productPreviewTemplate.innerHTML = `
    <div class="card card-side card-compact bg-neutral shadow-xl h-24">
        <figure class="flex-shrink-0">
            <img id="preview-image" class="h-full aspect-square object-cover" />
        </figure>
        <div class="flex flex-col flex-auto p-4 justify-center overflow-hidden w-full">
            <h2 id="product-name" class="card-title line-clamp-1"></h2>
            <div class="text-neutral-content flex items-center gap-2">
                <span id="seller" class="line-clamp-1"></span>
                <div id="stock-indicator" class="flex-shrink-0 badge badge-outline"></div>
            </div>
        </div>
    </div>
`

class ProductPreview extends HTMLElement {
    public readonly product: Product

    constructor(product: Product) {
        super()
        this.product = product
        this.appendChild(productPreviewTemplate.content.cloneNode(true))

        const previewImage = this.querySelector<HTMLImageElement>('#preview-image')!
        previewImage.src = product.imageUrl.toString()
        previewImage.alt = `${product.name} display image`

        const productName = this.querySelector<HTMLHeadingElement>('#product-name')!
        productName.textContent = product.name

        const seller = this.querySelector<HTMLSpanElement>('#seller')!
        seller.textContent = product.seller

        const stockIndicator = this.querySelector<HTMLDivElement>('#stock-indicator')!
        stockIndicator.textContent = product.inStock ? 'In Stock' : 'Out of Stock'
        stockIndicator.classList.add(product.inStock ? 'badge-success' : 'badge-error')
    }
}

const template = document.createElement('template')
template.innerHTML = `
    <dialog id="modal" class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Add Item</h3>
            <form method="dialog" class="flex gap-4 my-4">
                <input type="text" name="item-input" class="input input-bordered w-full" placeholder="Enter URL or product ID" />
                <button id="search-button" type="button" disabled class="btn btn-square">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="h-4 w-4" fill="currentColor">
                        <!--!Font Awesome Free 6.7.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                        <path
                            d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
                        />
                    </svg>
                </button>
            </form>
            <div class="modal-action">
                <button id="add-item-button" disabled class="btn">Add Item</button>
                <button id="close-button" class="btn">Close</button>
            </div>
        </div>
    </dialog>
`

class ProductSearchModal extends HTMLElement {
    private readonly modal: HTMLDialogElement
    private readonly input: HTMLInputElement
    private readonly form: HTMLFormElement
    private readonly searchButton: HTMLButtonElement
    private readonly addItemButton: HTMLButtonElement
    private readonly closeButton: HTMLButtonElement

    public onadd: ((addedProduct: Product) => any) | null = null

    constructor() {
        super()
        this.appendChild(template.content.cloneNode(true))

        this.modal = this.querySelector<HTMLDialogElement>('dialog')!

        this.form = this.querySelector<HTMLFormElement>('form')!

        this.input = this.querySelector<HTMLInputElement>('input[type="text"]')!
        this.input.oninput = this.inputHandle
        this.input.onchange = this.changeHandle

        this.searchButton = this.querySelector<HTMLButtonElement>('#search-button')!
        this.searchButton.onclick = this.searchHandle

        this.addItemButton = this.querySelector<HTMLButtonElement>('#add-item-button')!
        this.addItemButton.onclick = this.addItem

        this.closeButton = this.querySelector<HTMLButtonElement>('#close-button')!
        this.closeButton.onclick = this.close
    }

    public open = () => {
        this.modal.showModal()
    }

    public close = () => {
        this.modal.close()
        this.input.value = ''
        this.inputState = 'empty'
        setTimeout(() => (this.searchResult = null), 100)
    }

    private set inputState(state: 'valid' | 'invalid' | 'empty') {
        switch (state) {
            case 'valid':
                this.input.classList.remove('input-error')
                this.input.classList.add('input-success')
                this.searchButton.disabled = false
                break
            case 'invalid':
                this.input.classList.remove('input-success')
                this.input.classList.add('input-error')
                this.searchButton.disabled = true
                break
            case 'empty':
                this.input.classList.remove('input-success', 'input-error')
                this.searchButton.disabled = true
                break
        }
    }

    private get searchResult(): Product | null {
        return this.querySelector<ProductPreview>('product-preview')?.product ?? null
    }

    private set searchResult(product: Product | null) {
        const currentResult = this.querySelector<ProductPreview>('product-preview')

        if (product === null) {
            currentResult?.remove()
            return
        }

        const newPreview = new ProductPreview(product)

        if (currentResult === null) {
            this.form.insertAdjacentElement('afterend', newPreview)
        } else {
            currentResult.replaceWith(newPreview)
        }
    }

    private inputHandle: GlobalEventHandlers['oninput'] = () => {
        const value = this.input.value

        if (value.length === 0) {
            this.inputState = 'empty'
            return
        }

        const validURL = URL.canParse(value) && /^https?:\/\/(?:www\.)?tanocstore\.net\/shopdetail\/\d{12}/.test(value)
        const validID = /^\d{1,12}$/.test(value) && Number.parseInt(value) > 0
        this.inputState = validURL || validID ? 'valid' : 'invalid'
    }

    private changeHandle: GlobalEventHandlers['onchange'] = () => {
        const value = this.input.value
        if (/^\d{1,11}$/.test(value)) this.input.value = value.padStart(12, '0')
    }

    private searchHandle: GlobalEventHandlers['onclick'] = async () => {
        const productId = URL.canParse(this.input.value) ? /\d{12}/.exec(this.input.value)![0] : this.input.value

        this.searchButton.disabled = true
        this.searchButton.innerHTML = spinner
        const product = await TanocStore.product(productId).catch(() => null)
        this.searchButton.innerHTML = searchSVG
        this.searchButton.disabled = false

        if (!product) {
            this.dispatchEvent(new AlertEvent({ message: 'Invalid URL/ID', type: 'alert-error' }))
            this.inputState = 'invalid'
            return
        }

        this.searchResult = product
        this.addItemButton.disabled = false
    }

    private addItem = () => {
        if (this.searchResult === null) return

        if (ProductManager.products.has(this.searchResult.id)) {
            this.dispatchEvent(new AlertEvent({ message: 'Product already being tracked', type: 'alert-warning' }))
            return
        }

        ProductManager.add(this.searchResult.id)
        if (this.onadd) this.onadd(this.searchResult)
    }

    public static define() {
        customElements.define('product-preview', ProductPreview)
        customElements.define('product-search-modal', ProductSearchModal)
    }
}

export default ProductSearchModal
