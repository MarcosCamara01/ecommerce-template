/** @type {import('tailwindcss').Config} */

// Theme colours are CSS variables (src/styles/globals.css) so light, dark and
// the product page tint all flow through the same utilities. Opacity
// modifiers (`bg-fg/10`) resolve through color-mix.
const mix = (variable) =>
  `color-mix(in srgb, var(${variable}) calc(<alpha-value> * 100%), transparent)`;

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-archivo)", "Arial Narrow", "sans-serif"],
      },
      colors: {
        bg: mix("--bg"),
        fg: mix("--fg"),
        panel: "var(--panel)",
        field: "var(--field)",
        hover: "var(--hover)",
        photo: "var(--photo)",
        glass: "var(--glass)",
        scrim: "var(--scrim)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        card: "var(--card)",
        ring: "var(--ring)",
        skel: "var(--skel)",
        muted: "var(--muted)",
        err: {
          bg: "var(--err-bg)",
          fg: "var(--err-fg)",
          line: "var(--err-line)",
        },
        // LEGACY-ALIASES: pre-redesign names mapped onto the new tokens while
        // pages are migrated. Delete once nothing references them.
        "background-primary": mix("--bg"),
        "background-secondary": mix("--bg"),
        "background-tertiary": "var(--card)",
        "border-primary": "var(--line)",
        "border-secondary": "var(--line)",
        "color-secondary": "var(--muted)",
        "color-tertiary": mix("--fg"),
      },
      borderRadius: {
        pill: "999px",
        field: "16px",
        chip: "20px",
        toast: "22px",
        photo: "24px",
        "photo-lg": "28px",
        section: "32px",
      },
      fontSize: {
        13: ["13px", "1.45"],
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        drawer: "var(--ease-drawer)",
      },
      transitionDuration: {
        120: "120ms",
        220: "220ms",
        250: "250ms",
        350: "350ms",
        420: "420ms",
        450: "450ms",
        600: "600ms",
      },
      boxShadow: {
        float: "var(--shadow-float)",
        lift: "var(--shadow-lift)",
        hero: "var(--shadow-hero)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        // Wishlist save: 1 → 1.32 → 0.9 → 1.06 → 1.
        pop: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.32)" },
          "55%": { transform: "scale(0.9)" },
          "75%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        // Sparks fly to (--dx, --dy) and fade.
        spark: {
          from: { transform: "translate(0, 0) scale(1)", opacity: "1" },
          to: { transform: "translate(var(--dx), var(--dy)) scale(0.3)", opacity: "0" },
        },
        // Bag counter: 1 → 1.2 → 1.
        bump: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        // Variant photo swap.
        swap: {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s var(--ease-out)",
        "accordion-up": "accordion-up 0.2s var(--ease-out)",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        pop: "pop 450ms var(--ease-out)",
        spark: "spark 520ms var(--ease-out) forwards",
        bump: "bump 320ms var(--ease-out)",
        swap: "swap 450ms var(--ease-out) both",
        "fade-in": "fade-in 450ms var(--ease-out) both",
      },
      screens: {
        xs: "350px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
