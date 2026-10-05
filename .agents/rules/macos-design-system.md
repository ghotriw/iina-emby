# macOS / IINA Design System Guidelines

This document defines the strict UI and design standards for the `iina-emby` plugin web interface. All current and future components must strictly follow these rules.

---

## 1. Window Frame & Header Context
* **No Traffic Lights in Webview Header:**  
  In the IINA standalone window, the window title bar (with macOS traffic lights: close, minimize, zoom) sits **above** the webview on its own native titlebar row.  
  * **DO NOT** add artificial `padding-left: 84px` / `5.25rem` for traffic lights clearance.
  * Toolbars and window headers must use **symmetric horizontal padding** (e.g. `1rem` to `1.25rem`).
* **Window Drag Region:**  
  Empty space on headers can use `-webkit-app-region: drag;` for macOS window movement, while interactive controls (buttons, inputs, links) must have `-webkit-app-region: no-drag;`.

---

## 2. Strict Units & Scale (Rem Only)
* **Never use raw pixel values** for typography, heights, paddings, margins, or corner radii in CSS.
* All measurements must be written in **`rem`** (`1rem = 16px`):
  * **`0.375rem` (6px) — `var(--radius-m)`:** The official IINA / AppKit native corner radius for controls (buttons, inputs, list row capsules, grouped panel insets).
  * **`0.5rem` (8px) — `var(--radius-l)`:** Dialog / Alert sheet corner radius, media cards, and content cards.
  * **`1.75rem` (28px):** Standard macOS control height (`NSTextField`, `NSButton`).
  * **`1.625rem` (26px):** Compact macOS buttons (Cancel / Connect in sheets).
  * **`2.125rem` (34px):** IINA Open... / Add Server capsule height.
  * **`2.75rem` (44px):** Standard macOS window toolbar height.
* Typography scale:
  * Caption / Muted: `0.6875rem` (11px) — `var(--font-size-caption)`
  * Subtitle / Input: `0.75rem` (12px) — `var(--font-size-sub)`
  * Body / List Item: `0.8125rem` (13px, Apple HIG body size) — `var(--font-size-body)`
  * Dialog Title / Card Title: `0.875rem` (14px) — `var(--font-size-title)`
  * H2 / Section Title: `1.125rem` (18px) — `var(--font-size-h2)`
  * H1 / Big Title: `1.375rem` (22px) — `var(--font-size-h1)`

---

## 3. Design Tokens & Translucent Materials
Always use the CSS variables defined in [`app/theme/tokens.css`](file:///Users/ghotriw/MyProjects/iina-emby/app/theme/tokens.css). **Never hardcode hex/rgb values in CSS modules.**

| Token | Purpose | Example Usage |
|---|---|---|
| `--bg-window` | Main window background | Surface behind content |
| `--bg-sidebar` | Left sidebar background | Library navigation pane |
| `--bg-panel` | Glass card background | Settings cards, SystemInfo cards |
| `--bg-control` | Subtle button capsule / track | Button default, progress track |
| `--bg-control-hover` | Hover state for buttons | Button hover |
| `--bg-row-hover` | Hover highlight for list items | Table rows, interactive cards |
| `--bg-input` | Translucent input background | Text fields |
| `--bg-dialog` | Modal dialog background | Popups and confirmation sheets |
| `--bg-tooltip` | Popover / dropdown background | Dropdown menus, tooltips |
| `--border-subtle` | Fine hairline card border | Card / row borders |
| `--border-control` | Interactive control border | Inputs, buttons |
| `--text-primary` | High-contrast white | Primary titles, active labels |
| `--text-secondary` | 65% opacity white | Subtitles, descriptions, metadata |
| `--text-tertiary` | 42% opacity white | Section headers, icons, timestamps |
| `--accent-blue` | macOS system action blue | Primary action buttons, active tabs |
| `--accent-teal` | Active connection / status | Online status, played checkmark |
| `--accent-red` | System red | Danger buttons, errors |
| `--danger-text` | High-visibility warning text | Destructive menu items, error labels |

---

## 4. UI Patterns & Best Practices

1. **Card & Section Layout (macOS System Settings Style):**
   * Group related settings and info into `<section>` blocks with an uppercase header:
     ```css
     .sectionTitle {
       font-size: 0.8125rem;
       font-weight: 600;
       text-transform: uppercase;
       letter-spacing: 0.05em;
       color: var(--text-tertiary);
       padding: 0 0.5rem;
     }
     ```
   * Enclose items in a glassmorphic card:
     ```css
     .card {
       background: var(--bg-panel);
       border: 1px solid var(--border-subtle);
       border-radius: var(--radius-l);
       overflow: hidden;
       backdrop-filter: blur(20px);
       -webkit-backdrop-filter: blur(20px);
     }
     ```

2. **Menus and Overlays (Native Popover API):**
   * Use native `popover="auto"` so overlays are rendered in the browser's **Top Layer** (never clipped by `overflow: hidden` on parent cards).
   * Use `@starting-style` for smooth entrance and exit animations.
   * Do not steal focus on light-dismiss (clicking outside).

3. **Built-in UI Component Library:**
   * Always prefer reusable UI primitives from [`app/components/ui/`](file:///Users/ghotriw/MyProjects/iina-emby/app/components/ui/):
     * `<Button>`: Standard macOS button with disabled state support.
     * `<GlassElement>`: Apple Liquid Glass button/pill/circle with realistic lens lighting.
     * `<DropdownMenu>`: Top-layer accessible menu with arrow navigation and compound items.
     * `<Alert>`: Informational, warning, or error banner.
     * `<Skeleton>`: Shimmer loading placeholders matching Apple HIG.
     * `<Modal>` & `<ConfirmModal>`: Native macOS-style alert sheets.

---

## 5. Language & Commit Policy
* **English Only:** Zero Cyrillic characters in code, CSS, comments, or user-facing UI text.
* **Conventional Commits:** Follow `feat(...)`, `fix(...)`, `perf(...)`, `refactor(...)`.
