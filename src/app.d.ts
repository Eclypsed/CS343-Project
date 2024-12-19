declare global {
    type Product = {
        id: string
        name: string
        seller: string
        modelNumber: string
        price: {
            amount: number
            currency: string
        }
        inStock: boolean
        stockAmount: number
        imageUrl: URL
        releaseDate: Date
        distributer: string
    }
}

export {}
