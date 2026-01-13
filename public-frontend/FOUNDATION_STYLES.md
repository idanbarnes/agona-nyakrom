Foundation styles live in `src/index.css` as CSS variables under the "Design Tokens (CSS Vars)" section. Update token values there to change the theme globally.

Tokens:
- --background, --foreground
- --surface, --surface-foreground
- --muted, --muted-foreground
- --border
- --primary, --primary-foreground
- --accent, --accent-foreground
- --danger, --warning, --success
- --ring
- --radius

Container standard:
- Use `className="container"` on a top-level wrapper to center content.
- Padding is standardized and responsive by default.

Dark mode (future):
- Add the `dark` class to `html` or `body` to activate the `.dark` token values.
