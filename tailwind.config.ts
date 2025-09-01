
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['Poppins', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Cores específicas da Sound4U
				sound4u: {
					neon: '#11CF81', // Verde neon principal
					neonDark: '#0FA165', // Verde neon escuro
					neonDarker: '#0F7149', // Verde neon mais escuro
					neonDarkest: '#125035', // Verde neon mais escuro
					black: '#090A09', // Preto profundo
					grayDark: '#0F0F0F', // Preto suave
					grayMedium: '#5B5B5A', // Cinza médio
					grayLight: '#A0A1A0', // Cinza claro
					grayLighter: '#DCDCDC', // Cinza mais claro
				},
				event: {
					DEFAULT: '#11CF81', // Verde neon para eventos confirmados
					accent: '#0EA5E9', // Azul para destaque
					pending: '#FCD34D', // Amarelo para pendentes
					confirmed: '#11CF81', // Verde neon para confirmados
					rejected: '#EF4444', // Vermelho para rejeitados
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'neon-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(17, 207, 129, 0.5)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(17, 207, 129, 0.8)'
					}
				},
				'glow-float': {
					'0%, 100%': {
						transform: 'translateY(0px)',
						boxShadow: '0 0 10px rgba(17, 207, 129, 0.3)'
					},
					'50%': {
						transform: 'translateY(-5px)',
						boxShadow: '0 0 20px rgba(17, 207, 129, 0.6)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'glow-float': 'glow-float 3s ease-in-out infinite'
			},
			boxShadow: {
				'neon': '0 0 10px rgba(17, 207, 129, 0.5)',
				'neon-lg': '0 0 20px rgba(17, 207, 129, 0.8)',
				'neon-xl': '0 0 30px rgba(17, 207, 129, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
