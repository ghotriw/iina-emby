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
  * **`0.375rem` (6px):** The official IINA / AppKit native corner radius for controls (buttons, inputs, list row capsules, grouped panel insets).
  * **`0.5rem` (8px):** Dialog / Alert sheet corner radius and media cards.
  * **`1.75rem` (28px):** Standard macOS control height (`NSTextField`, `NSButton`).
  * **`1.625rem` (26px):** Compact macOS buttons (Cancel / Connect in sheets).
  * **`2.125rem` (34px):** IINA Open... / Add Server capsule height.
  * **`2.75rem` (44px):** Standard macOS window toolbar height.
* Typography scale:
  * Caption / Muted: `0.6875rem` (11px)
  * Subtitle / Input: `0.75rem` (12px)
  * Body / List Item: `0.8125rem` (13px, Apple HIG body size)
  * Dialog Title: `0.875rem` (14px)
  * H2 / Section Title: `1.125rem` (18px)
  * H1 / Big Title: `1.375rem` (22px)

---

## 3. Design Tokens & Translucent Materials
Always use the CSS variables defined in [`app/theme/tokens.css`](file:///Users/ghotriw/MyProjects/iina-emby/app/theme/tokens.css):

| Token | Value | Purpose |
|---|---|---|
| `--bg-window` | `transparent` | Transparent body for IINA HUD window |
| `--bg-sidebar` | `rgba(16, 16, 22, 0.45)` | Left sidebar pane with blur |
| `--bg-panel` | `rgba(255, 255, 255, 0.04)` | Inset grouped boxes / sheets |
| `--bg-control` | `rgba(255, 255, 255, 0.12)` | Subtle button capsule (Open..., Cancel) |
| `--bg-control-hover` | `rgba(255, 255, 255, 0.18)` | Hover state for buttons |
| `--bg-row-hover` | `rgba(255, 255, 255, 0.08)` | Hover highlight for list items |
| `--bg-input` | `rgba(0, 0, 0, 0.3)` | Translucent text fields |
| `--bg-dialog` | `rgba(26, 26, 32, 0.92)` | NSAlert sheets / confirm modals |
| `--text-primary` | `#ffffff` | Primary text |
| `--text-secondary` | `rgba(255, 255, 255, 0.65)` | Secondary labels |
| `--text-tertiary` | `rgba(255, 255, 255, 0.42)` | Muted captions |
| `--accent-blue` | `#007aff` | macOS system action blue |
| `--accent-teal` | `#12b886` | Active Emby server / media accent |
| `--accent-red` | `#ff453a` | Destructive actions (Remove server) |

---

## 4. UI Patterns & Best Practices
1. **Lists (NSTableView style):**
   * Transparent background by default, no thick card borders.
   * `min-height: 2.75rem` (44px), `padding: 0.5rem 0.75rem`, `border-radius: var(--radius-control)`.
   * Action icons (like trash) should be hidden by default (`opacity: 0`) and fade in on row hover (`opacity: 1`) to keep the interface calm.
2. **Forms & Dialogs (NSAlert / Sheet style):**
   * Never render web close buttons ("X" in the corner) in alert dialogs.
   * Action buttons belong on the bottom right: `[ Cancel ]` (gray capsule) and `[ Action ]` (accent blue or red).
3. **Mantine Components:**
   * Theme defaults in [`app/theme/theme.ts`](file:///Users/ghotriw/MyProjects/iina-emby/app/theme/theme.ts) automatically wire tokens into Mantine.
   * Prefer using configured Mantine components (`<Button>`, `<TextInput>`, `<Modal>`) or semantic HTML with token classes.

---

## 5. Language Policy
* Zero Cyrillic characters in code, CSS, or comments.
* User-facing text in the UI should be in clean, idiomatic English.
