import { fontFamily } from "tailwindcss/defaultTheme";
/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: "hsl(var(--playlight-border) / <alpha-value>)",
				input: "hsl(var(--playlight-input) / <alpha-value>)",
				ring: "hsl(var(--playlight-ring) / <alpha-value>)",
				background: "hsl(var(--playlight-background) / <alpha-value>)",
				foreground: "hsl(var(--playlight-foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--playlight-primary) / <alpha-value>)",
					foreground: "hsl(var(--playlight-primary-foreground) / <alpha-value>)",
				},
				secondary: {
					DEFAULT: "hsl(var(--playlight-secondary) / <alpha-value>)",
					foreground: "hsl(var(--playlight-secondary-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "hsl(var(--playlight-destructive) / <alpha-value>)",
					foreground: "hsl(var(--playlight-destructive-foreground) / <alpha-value>)",
				},
				muted: {
					DEFAULT: "hsl(var(--playlight-muted) / <alpha-value>)",
					foreground: "hsl(var(--playlight-muted-foreground) / <alpha-value>)",
				},
				accent: {
					DEFAULT: "hsl(var(--playlight-accent) / <alpha-value>)",
					foreground: "hsl(var(--playlight-accent-foreground) / <alpha-value>)",
				},
				popover: {
					DEFAULT: "hsl(var(--playlight-popover) / <alpha-value>)",
					foreground: "hsl(var(--playlight-popover-foreground) / <alpha-value>)",
				},
				card: {
					DEFAULT: "hsl(var(--playlight-card) / <alpha-value>)",
					foreground: "hsl(var(--playlight-card-foreground) / <alpha-value>)",
				},
			},
			borderRadius: {
				xl: "calc(var(--playlight-radius) + 4px)",
				lg: "var(--playlight-radius)",
				md: "calc(var(--playlight-radius) - 2px)",
				sm: "calc(var(--playlight-radius) - 4px)",
			},
			fontFamily: {
				sans: ["Geist", ...fontFamily.sans],
			},
		},
	},
};
export default config;
