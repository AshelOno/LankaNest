import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			boxShadow: {
				'text': '0 0 5px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 0, 0, 0.3)', // Custom text shadow
				'lux': '0 18px 46px -16px rgba(7,26,61,0.28), 0 8px 20px rgba(15,139,111,0.08)',
				'lux-glow': '0 0 0 1px rgba(215,179,90,0.24), 0 18px 44px rgba(7,26,61,0.18)',
			},
			fontFamily: {
				sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				blue: {
					50: '#EEF7FF',
					100: '#DCEEFF',
					200: '#B9DCFF',
					300: '#7FB7EA',
					400: '#3D8CCC',
					500: '#1769A8',
					600: '#0D5792',
					700: '#0A4174',
					800: '#08345D',
					900: '#061431',
					950: '#030A1A',
				},
				primaryBgColor: '#0A4174',
				brand: {
					50: '#EEF7FF',
					100: '#DCEEFF',
					200: '#B9DCFF',
					500: '#1769A8',
					600: '#0D5792',
					700: '#0A4174',
					800: '#08345D',
					900: '#062844',
				},
				success: '#0F8B6F',
				warning: '#D7B35A',
				lux: {
					DEFAULT: '#0A4174',
					gold: '#D7B35A',
					light: '#F8FBFF',
					border: '#D8E2F1',
					muted: '#5E6B7E',
					sapphire: '#0A4174',
					emerald: '#0F8B6F',
					coral: '#DF5267',
					amber: '#B98518',
					violet: '#7C4DE3',
				}
			}
		}
	},
	plugins: [animate],
}
