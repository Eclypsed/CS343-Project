import daisyui from 'daisyui'
import * as defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,ts}'],
    theme: {
        extend: {
            fontFamily: {
                notoSans: ["'Noto Sans', 'Noto Sans HK', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', 'Noto Sans TC'", ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [daisyui],
    daisyui: {
        themes: true,
    },
}
