import TanocStoreLogoImage from '@images/tanocStoreLogo.png'

const template = document.createElement('template')
template.innerHTML = `
     <a class="bg-primary inline-block" href="https://www.tanocstore.net/" target="_blank">
        <img alt="TANO*C STORE Logo" class="opacity-0" aria-hidden="true" />
    </a>
`

class TanocStoreLogo extends HTMLElement {
    constructor() {
        super()
        this.appendChild(template.content.cloneNode(true))

        const image = this.querySelector('img')!
        image.src = TanocStoreLogoImage

        const link = this.querySelector('a')!
        link.style.maskImage = `url("${TanocStoreLogoImage}")`
    }

    public static define() {
        customElements.define('tanoc-store-logo', TanocStoreLogo)
    }
}

export default TanocStoreLogo
