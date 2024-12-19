type Theme = 'dark' | 'light' | 'synthwave' | 'valentine' | 'aqua' | 'dracula'

class ThemeManager {
    public static readonly DEFAULT_THEME: Theme = 'dark'
    public static readonly VALID_THEMES = new Set<Theme>(['dark', 'light', 'synthwave', 'valentine', 'aqua', 'dracula'])

    public static get activeTheme(): Theme {
        const storedTheme = localStorage.getItem('theme')
        if (!storedTheme || !this.validTheme(storedTheme)) {
            this.activeTheme = this.DEFAULT_THEME
            return this.DEFAULT_THEME
        }
        return storedTheme
    }

    public static set activeTheme(theme: Theme) {
        localStorage.setItem('theme', theme)
    }

    public static validTheme(theme: string): theme is Theme {
        return this.VALID_THEMES.has(theme as Theme)
    }
}

function loadTheme() {
    const html = document.querySelector('html')
    if (!html) {
        console.error('Failed to load theme')
        return
    }

    html.dataset.theme = ThemeManager.activeTheme
}

export default ThemeManager
export { loadTheme, type Theme }
