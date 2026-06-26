# UI Components

## GoBackButton

The public frontend back control lives in:

- `public-frontend/src/components/ui/go-back-button.jsx`

The admin frontend uses a matching app-local component in:

- `admin-frontend/src/components/ui/go-back-button.jsx`

Use `GoBackButton` for page-level back navigation on detail, create, and edit screens that need a compact top-left control. Import it from the app's local UI barrel:

```jsx
import { GoBackButton } from '../../components/ui/index.jsx'
```

Supported props:

- `to`: navigates directly to a known parent route, preserving pages that previously linked to a listing page.
- `fallbackTo`: used when the component is acting as browser-history back and there is no useful browser history.
- `label`: accessible label for screen readers. It is also shown when `showLabel` is true.
- `showLabel`: defaults to `false`; keep the default for the standard compact arrow-only design.
- `className`: optional layout adjustment, such as header margin.
- `replace`: optional route replacement when using `to`.

Design rules:

- Render the default arrow-only button at the top-left of the page content area.
- Keep it compact, rounded, keyboard focusable, and visually subtle.
- Use `to` when the previous implementation always went to a parent listing page.
- Use history behavior with `fallbackTo` only when the page should behave like a true browser back button.
- Do not use it for empty-state recovery actions, pagination controls, breadcrumbs, or inline links where visible text is needed for clarity.
