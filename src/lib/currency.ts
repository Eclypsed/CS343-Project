import ky from 'ky'
import { IDBPDatabase, openDB, StoreNames, type DBSchema } from 'idb'

export type Currency = {
    symbol: string
    name: string
    code: string
    decimal_digits: number
}

class CurrencyAPI {
    private static readonly api = ky.create({
        prefixUrl: 'https://api.currencyapi.com/v3/',
        method: 'get',
        headers: { apikey: import.meta.env.VITE_CURRENCY_API_KEY },
    })

    public static async getCurrencies(): Promise<Record<string, Currency>> {
        console.log('Fetched new currencies')
        const response = await this.api('currencies').json<{ data: Record<string, Currency> }>()
        return response.data
    }

    public static async getExchangeRates(currencies?: Iterable<string>, baseCurrency: string = 'USD'): Promise<Record<string, number>> {
        const searchParams = new URLSearchParams()
        searchParams.set('base_currency', baseCurrency)
        if (currencies) searchParams.set('currencies', Array.from(currencies).join(','))

        console.log('Fetched new exchange rates')
        const response = await this.api('latest', { searchParams }).json<{ data: Record<string, { code: string; value: number }> }>()
        const exchangeRates: Record<string, number> = {}
        Object.values(response.data).forEach(({ code, value }) => (exchangeRates[code] = value))
        return exchangeRates
    }
}

export type CurrencyDBEntry = Currency & { enabled: boolean }

interface CurrencyDBSchema extends DBSchema {
    currencies: {
        key: string // Currency Code
        value: CurrencyDBEntry
    }
    // All exchange rates are in relation to USD (base_currency in CurrencyAPI)
    exchangeRates: {
        key: string // Currency Code
        value: number
    }
}

const DEFAULT_CURRENCY = 'USD'
const DEFAULT_ENABLED_CURRENCIES = new Set<string>([DEFAULT_CURRENCY, 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'])

class CurrencyDB {
    private static dbInstance: IDBPDatabase<CurrencyDBSchema> | null = null
    private static readonly storeConfig = new Map<StoreNames<CurrencyDBSchema>, IDBObjectStoreParameters | undefined>([
        ['currencies', { keyPath: 'code' }],
        ['exchangeRates', undefined],
    ])

    private static async initDB(): Promise<IDBPDatabase<CurrencyDBSchema>> {
        const db = await openDB<CurrencyDBSchema>('Currency', 1, {
            upgrade: (db) =>
                this.storeConfig.forEach((config, storeName) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, config)
                    }
                }),
        })

        const countTx = db.transaction(['currencies', 'exchangeRates'], 'readonly')
        const currencyEntryCount = await countTx.objectStore('currencies').count()
        const exchangeRatesEntryCount = await countTx.objectStore('exchangeRates').count()
        await countTx.done

        if (currencyEntryCount === 0) {
            const currencies = await CurrencyAPI.getCurrencies()
            const currecyDBEntries = Object.values(currencies).map(
                (currency): CurrencyDBEntry => Object.assign(currency, { enabled: DEFAULT_ENABLED_CURRENCIES.has(currency.code) }),
            )

            const currencyTx = db.transaction('currencies', 'readwrite')
            await Promise.all(currecyDBEntries.map((currency) => currencyTx.store.put(currency)))
            await currencyTx.done
        }

        if (exchangeRatesEntryCount === 0) {
            await this.initExchangeRates(db)
        }

        return db
    }

    public static async initExchangeRates(db: IDBPDatabase<CurrencyDBSchema>) {
        const newExchangeRates = await CurrencyAPI.getExchangeRates()

        const tx = db.transaction('exchangeRates', 'readwrite')
        await tx.store.clear()
        await Promise.all(Object.entries(newExchangeRates).map(([key, val]) => tx.store.add(val, key)))
        await tx.done
    }

    public static async open(): Promise<IDBPDatabase<CurrencyDBSchema>> {
        if (this.dbInstance === null) {
            this.dbInstance = await this.initDB()
        }

        return this.dbInstance
    }
}

const db = await CurrencyDB.open()

class CurrencyManager {
    public static get activeCurrency(): string {
        const storedCurrency = localStorage.getItem('currency')
        if (storedCurrency === null) {
            this.activeCurrency = DEFAULT_CURRENCY
            return DEFAULT_CURRENCY
        } else {
            return storedCurrency
        }
    }

    public static set activeCurrency(currencyCode: string) {
        localStorage.setItem('currency', currencyCode)
    }

    public static async getCurrency(currencyCode: string): Promise<CurrencyDBEntry | undefined> {
        return await db.get('currencies', currencyCode)
    }

    public static async getAllCurrencies(): Promise<CurrencyDBEntry[]> {
        return await db.getAll('currencies')
    }

    public static async getEnabledCurrencies(): Promise<CurrencyDBEntry[]> {
        const enabledCurrencies: Array<Currency & { enabled: boolean }> = []
        const tx = db.transaction('currencies')
        for await (const cursor of tx.store) {
            if (cursor.value.enabled) enabledCurrencies.push(cursor.value)
        }
        return enabledCurrencies
    }

    public static async setCurrencyEnabled(currencyCode: string, enabled: boolean) {
        const tx = db.transaction('currencies', 'readwrite')
        const store = tx.store
        const currency = await store.get(currencyCode)
        if (!currency) throw Error(`Invalid currency code: ${currencyCode}`)

        currency.enabled = enabled
        await store.put(currency)
        await tx.done

        if (!enabled && this.activeCurrency === currency.code) {
            this.activeCurrency = DEFAULT_CURRENCY
        }
    }

    public static async getExchangeRate(fromCurrencyCode: string, toCurrencyCode: string): Promise<number | undefined> {
        const toUSD = await db.get('exchangeRates', fromCurrencyCode)
        const toNewCurrency = await db.get('exchangeRates', toCurrencyCode)

        if (!toUSD || !toNewCurrency) return undefined

        return toUSD / toNewCurrency
    }

    public static async setExchangeRate(currencyCode: string, exchangeRate: number): Promise<string> {
        return await db.put('exchangeRates', exchangeRate, currencyCode)
    }

    public static refreshExchangeRates = async () => {
        await CurrencyDB.initExchangeRates(db)
    }
}

export default CurrencyManager
