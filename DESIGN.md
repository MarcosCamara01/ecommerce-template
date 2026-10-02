---
name: Store — Chromatic
description: A clothing store where the product page takes the colour of the garment, set in giant condensed type on a cool neutral ground.
colors:
  ground-light: "#E4E7EA"
  ink-light: "#111214"
  ground-dark: "#141516"
  ink-dark: "#ECEDEE"
  panel-light: "#F6F7F8"
  panel-dark: "#1C1D20"
  field-light: "#F3F4F5"
  field-dark: "#1C1D1F"
  hover-light: "#2E3034"
  hover-dark: "#C9CBCE"
  photo-ground: "#E4E7EA"
  error-surface-light: "#FBE3E2"
  error-ink-light: "#8C1D18"
  error-line-light: "#B3261E"
  error-surface-dark: "#2A1215"
  error-ink-dark: "#FFB3B6"
  error-line-dark: "#FF8D92"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "min(240px, 16vw)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "normal"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "min(120px, 8.3vw)"
    fontWeight: 900
    lineHeight: 0.85
    fontVariation: "'wdth' 62"
  title:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 0.95
    fontVariation: "'wdth' 75"
  wordmark:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 62"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  price:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  pill: "999px"
  section: "32px"
  photo-lg: "28px"
  photo: "24px"
  toast: "22px"
  chip: "20px"
  field: "16px"
  thumb: "14px"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "32px"
  section-y: "96px"
  stack-sm: "8px"
  stack-md: "14px"
  stack-lg: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.ground-light}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 26px"
  button-primary-hover:
    backgroundColor: "{colors.hover-light}"
    textColor: "{colors.ground-light}"
  button-primary-large:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.ground-light}"
    rounded: "{rounded.pill}"
    height: "64px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 22px"
  chip-size:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.pill}"
    height: "52px"
  chip-size-selected:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.ground-light}"
    rounded: "{rounded.pill}"
    height: "52px"
  input:
    backgroundColor: "{colors.field-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.field}"
    height: "52px"
    padding: "0 18px"
  toast:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.ground-light}"
    rounded: "{rounded.toast}"
    padding: "8px 8px 8px 18px"
  nav-pill:
    backgroundColor: "rgba(255,255,255,0.45)"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.pill}"
    padding: "6px"
  product-photo:
    backgroundColor: "{colors.photo-ground}"
    rounded: "{rounded.photo-lg}"
---

# Design System: Store — Chromatic

## Overview

**Creative North Star: "The Fitting-Room Swatch"**

The store is a cool, quiet grey room where the clothes do the talking. Everywhere except the product page, the ground is a neutral light grey (or a near-black in dark mode) and the type is ink. On the product page the whole room takes the colour of the garment you are looking at: pick Navy and the page floods navy from the swatch you tapped. Colour is earned by the product, never applied as decoration.

The voice is giant, condensed, black uppercase: Archivo at 62% width set so large it touches the edges of the viewport, scaled with `min(px, vw)`. Everything else is Geist at 15px, calm and legible. Controls are pills; photographs are soft-cornered tiles on their own pale ground so cut-outs and studio shots read the same on any tint.

Motion is physical and short: things press, slide from the edge they live on, and settle. Delight is reserved for three moments (choosing a colour, saving to the wishlist, completing an order) and never repeats on back navigation.

**Key Characteristics:**
- Neutral ground everywhere, garment colour only on the product page.
- Condensed black uppercase display type at viewport scale.
- Pills for every control, 24–28px tiles for every photo.
- A floating glass navigation pill on desktop; a full-screen sheet on mobile.
- Light and dark for every page, both at WCAG AA.

## Colors

A two-value system: one ground and one ink per theme, with every other surface mixed from those two.

### Primary
- **Ink** (`ink-light` / `ink-dark`): text, icons, primary buttons, the selected size pill, toasts. Primary buttons are ink-filled with ground-coloured text, so the accent is always the ink itself.

### Neutral
- **Cool Ground** (`ground-light`): page background in light mode, and the text colour on ink-filled controls.
- **Night Ground** (`ground-dark`): page background in dark mode.
- **Panel** (`panel-light` / `panel-dark`): drawers, sheets, menus and dialogs that sit above the page.
- **Field** (`field-light` / `field-dark`): text inputs and selects.
- **Photo Ground** (`photo-ground`): the fixed pale backdrop behind every product photo, in both themes and on every tint.
- **Lines and washes** (derived): hairlines are ink at 20% (`--line`), soft dividers 15%, selected-card wash 8% (`--card`), skeletons 10%, focus halo 15% (`--ring`). Secondary text is ink at 75% mixed into the ground (`--muted`), never a separate grey.
- **Glass** (derived): the navigation pill is white at 45% over light text grounds and white at 10% over dark ones, blurred 20px. It follows the lightness of the ink, so it also adapts on a tinted product page.

### Tertiary
- **Error** (`error-*`): only for failures. Surface, ink and line variants per theme; never decorative.

### Named Rules
**The Earned Colour Rule.** Only the product page changes the page colour, and only to the tint of the chosen variant. Every other page sits on Cool Ground or Night Ground.

**The Two Values Rule.** New surfaces are mixed from `--bg` and `--fg` (`color-mix`), not picked from a palette. If a colour cannot be described as ink-at-N%, it needs a reason.

**The Tint Contract.** A variant tint is four values: light ground, light ink, dark ground, dark ink. Known garment colours have hand-tuned tints; any other colour derives its tint from `colorMapping` and must clear 4.5:1 between ground and ink.

## Typography

**Display Font:** Archivo (variable, width axis 62–125) with Arial Narrow fallback
**Body Font:** Geist with system-ui fallback

**Character:** a poster face for the shop window and a workmanlike grotesque for the shop floor. The display face is always condensed to 62%, weight 900, uppercase; the body face never shouts.

### Hierarchy
- **Display** (900, `min(240px, 16vw)` down to `min(104px, 7.2vw)`, line-height 0.8–0.84): page titles such as the hero word, category names, "Bag", "Thank you.", "404".
- **Headline** (900, `min(120px, 8.3vw)`, 0.85): section titles ("Wear it with", "Goes with …"). Mobile uses fixed sizes (50px menu, 120px listing).
- **Title** (700, width 75%, 26–44px, 0.95–1): product names under a giant word.
- **Wordmark** (800, 26px): the STORE mark in the navigation.
- **Body** (400, 15px, 1.5): descriptions, lists, form copy. Keep measure under 70ch.
- **Label** (400–500, 12–14px): metadata such as "Sweatshirts · Grey marl", stock, captions; secondary emphasis comes from 75–85% ink, not a smaller weight.
- **Price** (500, 18–26px): prices in their own line, tabular numerals.

### Named Rules
**The Viewport Scale Rule.** Display sizes are always written as `min(<px>, <vw>)` so the word fills the width on any screen without overflowing. Hero words compute their size from the word's own em-width.

**The One Voice Rule.** Archivo only appears condensed (62%, or 75% for product names). Never use it at normal width or in sentence case.

## Layout

Desktop pages use a 32px side gutter, sections separated by 96px. Mobile uses a 16px gutter. Grids are fluid (`repeat(auto-fit, minmax(min(280px, 100%), 1fr))` on desktop, two columns on mobile with 18px × 10px gaps). The product page is a 7fr / 5fr split with a sticky buy column (top 100px). Category bands on the home page run edge to edge with hairlines between them. The footer ends in the STORE wordmark at `min(420px, 29vw)`. No page scrolls horizontally at 390px.

## Elevation & Depth

Mostly flat. Depth comes from three soft, offset shadows and from the scrim behind drawers, never from borders plus shadows together.

### Shadow Vocabulary
- **Float** (`0 10px 40px rgba(0,0,0,.12)`): the navigation pill.
- **Lift** (`0 20px 50px rgba(0,0,0,.2)`): toasts, menus, the flying product photo.
- **Hero** (`0 40px 100px rgba(0,0,0,.28)`): the home hero photo and modal dialogs.
- **Drawer edge** (`-30px 0 80px rgba(0,0,0,.25)`): the bag drawer while open.

### Named Rules
**The Flat-By-Default Rule.** Cards have no shadow at rest. Hover on a fine pointer lifts a card 4px and scales its photo to 1.03; nothing else.

## Shapes

Pills (999px) for every button, chip, size, nav item, search field and badge. Photos sit in 24px (cards, rails) or 28px (product gallery, hero) tiles over Photo Ground. Panels and section cards use 28–32px; toasts 22px; inputs 16px; thumbnails 14–16px. Corners are concentric: a thumbnail inside a 20px chip uses 14px.

## Components

### Buttons
- **Shape:** full pill (999px).
- **Primary:** ink fill, ground text, 600 weight, 56px tall (64px for Add to bag, 60px for Checkout).
- **Hover / Press:** hover darkens to the hover tone; press scales to 0.97 in 120ms ease-out. Focus shows a 2px ink ring with a ground-coloured gap.
- **Secondary:** 1px ink outline, 48px. **Text link:** underlined with 3px offset.
- **Busy:** a 16px ring spinner before the label ("Adding…"). **Disabled:** dashed hairline, 65% opacity.

### Chips
- **Size pills:** six equal pills, 52px tall. The selected pill is a single ink capsule that slides between sizes (220ms ease-in-out); out-of-stock sizes are dashed and struck through.
- **Colour variants:** 20px-radius chips with a 48×60 thumbnail, name and stock line; the selected one has a 1.5px ink border and an 8% wash.
- **Filters:** 40px pills; selected is ink-filled.

### Cards / Containers
- **Corner Style:** 24px photo tile; text sits below the photo, never on top.
- **Background:** none; the photo tile carries Photo Ground.
- **Shadow Strategy:** flat (see Elevation).
- **Wishlist heart:** a 40px white disc on the photo's corner.

### Inputs / Fields
- **Style:** 52px tall, 16px radius, Field background, hairline border.
- **Focus:** border turns ink and a 4px halo at ink 15% appears.
- **Error:** error-line border with the message below in error ink.

### Navigation
- **Desktop:** a centred floating pill (6px padding) with the STORE wordmark, category links, icon buttons (44px), the theme toggle and an ink "Bag · n" pill. The current category is ink-filled. Glass background blurred 20px.
- **Mobile:** a 56px bar with the wordmark and 44px icon buttons; the menu is a full-screen sheet with 50px condensed category rows and thumbnails, account tiles, help links and a dark-mode switch.

### Bag Drawer (signature)
A 460px panel that slides in from the right edge over a 32% scrim, items staggered 50ms. On mobile, an "Added" panel rises from the bottom and can be dragged down to dismiss.

## Do's and Don'ts

### Do:
- **Do** derive every surface from `--bg` and `--fg`; use `color-mix` for washes and lines.
- **Do** write display sizes as `min(px, vw)` and keep Archivo at 62% width, weight 900, uppercase.
- **Do** put every product photo on Photo Ground (#E4E7EA) with a 24–28px radius.
- **Do** use the motion tokens: `--ease-out` cubic-bezier(0.23, 1, 0.32, 1), `--ease-in-out` cubic-bezier(0.77, 0, 0.175, 1), `--ease-drawer` cubic-bezier(0.32, 0.72, 0, 1); press 120ms, pills 220ms, toasts 350/250ms, drawers 420ms, scrim 200ms, colour reveal 600–650ms, theme 500ms.
- **Do** keep fades and drop movement under `prefers-reduced-motion`.
- **Do** leave merchant facts the code does not define (delivery, returns, measurements, fit, address) as visible placeholders.

### Don't:
- **Don't** tint any page other than the product page.
- **Don't** animate opening search with ⌘K or "/", typing results, filters, sorting or tab switches.
- **Don't** celebrate removals: unsaving a wishlist item or emptying the bag is instant.
- **Don't** add borders and shadows to the same element, or shadows to cards at rest.
- **Don't** use grey text: secondary text is ink at 75–85%.
- **Don't** invent shipping, returns or sizing policies.
