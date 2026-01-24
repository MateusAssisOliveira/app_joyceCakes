import type { Config } from 'tailwindcss';

const { fontFamily } = require("tailwindcss/defaultTheme");

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // --- FONTES ---
      // Define as fontes personalizadas para serem usadas com as classes do Tailwind.
      fontFamily: {
        // Fonte do corpo de texto e geral da UI.
        sans: ["var(--font-poppins)", ...fontFamily.sans],
        // Fonte elegante para títulos e destaques.
        headline: ["var(--font-lora)"],
        body: ["var(--font-poppins)"],
      },

      // --- CORES ---
      // Mapeia as variáveis CSS de cor para as classes do Tailwind.
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },

      // --- ARREDONDAMENTO DAS BORDAS ---
      // Define os tamanhos do arredondamento para um visual mais suave.
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 4px)`,
        sm: `calc(var(--radius) - 8px)`,
      },

      // --- ANIMAÇÕES ---
      // Animações personalizadas para componentes como o Accordion.
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },

      // --- SOMBRAS ---
      // Define a sombra padrão para os cards, criando o efeito de flutuação.
      boxShadow: {
        sm: '0 4px 12px 0 hsl(var(--foreground) / 0.05)',
        subtle: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
