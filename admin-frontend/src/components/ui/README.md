# UI Kit (Admin)

Use these components instead of ad-hoc Tailwind in pages.

## Components

- Button: `variant` (primary, secondary, danger, ghost), `size` (sm, md, lg, icon), `loading`, `disabled`
- Input, Textarea, Select: `error` boolean or `aria-invalid`
- Label
- FormField: `label`, `htmlFor`/`id`, `helpText`, `errorText`, `required`
- Card: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- Badge: `variant` (default, success, warning, danger, muted)
- StatusBadge: `published` or `status` (published, draft)
- Modal: `open`, `onClose`, `size` (sm, md, lg), `closeOnOverlayClick`
- Table: `Table`, `TableToolbar`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TableEmptyState`, `TableLoading`
- Pagination: `page`, `totalPages`, `onChange`
- Toast styles: `toastStyles` map for class names

## Usage

### Button
```jsx
import { Button } from './ui'

<Button variant="secondary" size="sm">Save</Button>
```

### FormField + Input
```jsx
import { FormField, Input } from './ui'

<FormField
  label="Title"
  helpText="Short label shown in the list view."
  errorText={error ? 'Title is required.' : null}
  required
>
  <Input placeholder="Enter title" />
</FormField>
```

### Table + Pagination
```jsx
import { Table, TableBody, TableCell, TableHead, TableRow, Pagination } from './ui'

<Table>
  <TableHead>
    <TableRow>
      <TableCell>Title</TableCell>
      <TableCell>Status</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>Example</TableCell>
      <TableCell>Draft</TableCell>
    </TableRow>
  </TableBody>
</Table>

<Pagination page={1} totalPages={5} onChange={setPage} />
```

### Modal
```jsx
import { Modal, Button } from './ui'

<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <p>Are you sure?</p>
  <div className="mt-4 flex justify-end">
    <Button variant="secondary">Cancel</Button>
  </div>
</Modal>
```

### StatusBadge
```jsx
import { StatusBadge } from './ui'

<StatusBadge status="published" />
```

## Toast styles

Apply the `toastStyles` map to your existing toast component by mapping type -> `toastStyles.variants[type]` and using `toastStyles.container`, `toastStyles.title`, and `toastStyles.message` for structure.
