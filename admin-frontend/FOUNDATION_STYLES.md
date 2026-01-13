# Foundation Styles (Phase 1)

Tokens live in `src/index.css` under the "Design Tokens" block:
- background, foreground
- surface, surface-foreground
- muted, muted-foreground
- border
- primary, primary-foreground
- accent, accent-foreground
- danger, warning, success
- ring
- radius

Container usage:
- Use the `container` utility for standard page width and padding.
- Config is in `tailwind.config.js`.

Focus ring behavior:
- `:focus-visible` uses `ring-2 ring-ring ring-offset-2 ring-offset-background`.

Enable dark mode later:
- Add `.dark` on the `html` or `body` element to activate dark tokens.
