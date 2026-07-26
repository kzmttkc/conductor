# Conductor official brand kit

Source of truth for icon, logo lockup, and typography.

## Assets

| File | Role |
|------|------|
| `official/mark.source.jpg` | Original mark art (ring + baton) |
| `official/lockup.source.jpg` | Original vertical lockup (mark + CONDUCTOR) |
| `official/mark.png` | Normalized mark (1024² PNG) |
| `official/lockup.png` | Normalized lockup (1024² PNG) |
| `official/COLORS.md` | Sampled brand colors |

Web-served copies live under `/public/brand/` and `/public/favicon.svg`.

## Typography

- **Brand / display:** Montserrat (geometric sans matching the CONDUCTOR wordmark)
- **Wordmark casing:** `CONDUCTOR` (all caps) with wide letter-spacing in lockups
- **UI body:** Montserrat; code remains monospace

## Usage

- Prefer `BrandMark` / `BrandLockup` / `BrandWordmark` from `@/components/brand`.
- Favicon & app icons use the official mark on black.
- Do not redraw the mark with different geometry or substitute a letter “C”.
