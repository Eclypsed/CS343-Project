function isStringArray(json: any): json is string[] {
    return Array.isArray(json) && json.every((item) => typeof item === 'string')
}

function canParseJSON(jsonString: string): boolean {
    try {
        JSON.parse(jsonString)
        return true
    } catch {
        return false
    }
}

class ProductManager {
    public static get products(): Set<string> {
        const existingIdsString = localStorage.getItem('products')

        if (existingIdsString && canParseJSON(existingIdsString)) {
            const existingIds = JSON.parse(existingIdsString)
            if (isStringArray(existingIds)) {
                return new Set(existingIds)
            }
        }

        return new Set()
    }

    public static add(productId: string) {
        const ids = this.products
        ids.add(productId)
        localStorage.setItem('products', JSON.stringify(Array.from(ids)))
    }

    public static delete(productId: string) {
        const ids = this.products
        ids.delete(productId)
        localStorage.setItem('products', JSON.stringify(Array.from(ids)))
    }
}

export default ProductManager
