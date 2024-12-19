import ky from 'ky'

const JST_OFFSET = 9

const api = ky.create({
    prefixUrl: 'https://makeshop.worldshopping.jp/prod/',
    method: 'get',
    searchParams: { shopKey: 'tanocstore_net' },
})

class TanocStore {
    public static async product(productId: string): Promise<Product> {
        productId = productId.padStart(12, '0')

        const productData = await api('product', { searchParams: { productId } }).json<WSAPI.Product>()

        const { product_name, price, vendor, ubrand_code, stock, image_url, created_date } = productData
        const stockAmount = Number.parseInt(stock)

        return {
            id: productId,
            name: product_name,
            seller: vendor,
            modelNumber: ubrand_code,
            price: {
                amount: Number(price),
                currency: 'JPY',
            },
            inStock: stockAmount > 0,
            stockAmount,
            imageUrl: new URL(image_url),
            releaseDate: parseDateString(created_date, JST_OFFSET),
            distributer: 'TANO*C Store',
        }
    }
}

function parseDateString(dateString: string, timezoneOffset: number = 0): Date {
    const year = Number.parseInt(dateString.substring(0, 4), 10)
    const month = Number.parseInt(dateString.substring(4, 6), 10) - 1
    const day = Number.parseInt(dateString.substring(6, 8), 10)
    const hour = Number.parseInt(dateString.substring(8, 10), 10)
    const minute = Number.parseInt(dateString.substring(10, 12), 10)
    const second = Number.parseInt(dateString.substring(12, 14), 10)

    return new Date(Date.UTC(year, month, day, hour - timezoneOffset, minute, second))
}

export default TanocStore

declare namespace WSAPI {
    type Product = {
        created_date: string //yyyymmddhhmmss
        ubrand_code: string // Product code
        categories: Array<{
            category_code: string
            category_path: string
        }>
        product_name: string
        price: string
        vendor: string // Label
        stock: string
        image_url: string
        main_content: string
    }

    type ExtraProductDetails = {
        stockAmount: number
        categories: string[]
        videoUrl?: string
    }
}
