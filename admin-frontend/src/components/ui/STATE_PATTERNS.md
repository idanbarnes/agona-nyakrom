# State UI Patterns

## State precedence
Always resolve states in this order:
1. **Loading** → render skeletons.
2. **Error** → render `ErrorState` (optionally with retry).
3. **Empty** → render `EmptyState`.
4. **Content** → render actual UI.

## List page example
```jsx
import {
  EmptyState,
  ErrorState,
  StateGate,
  TableSkeleton,
} from './index.jsx'

<StateGate
  loading={isLoading}
  error={error}
  isEmpty={!isLoading && !error && items.length === 0}
  skeleton={<TableSkeleton rows={6} />}
  errorFallback={<ErrorState message={error?.message} onRetry={fetchItems} />}
  empty={
    <EmptyState
      title="No items yet"
      description="Create your first entry to get started."
      action={<button type="button">Create</button>}
    />
  }
>
  {/* render list/table */}
</StateGate>
```

## Detail page example
```jsx
import { DetailSkeleton, ErrorState, StateGate } from './index.jsx'

<StateGate
  loading={isLoading}
  error={error}
  isEmpty={!isLoading && !error && !item}
  skeleton={<DetailSkeleton />}
>
  {/* render detail view */}
</StateGate>
```

## Skeleton guidance
- **TableSkeleton**: data tables and admin lists.
- **ListSkeleton**: stacked lists or feeds.
- **DetailSkeleton**: detail pages with a hero/media and body content.
- **CardSkeleton**: card-based grids.

## ImageWithFallback
```jsx
import { ImageWithFallback } from './index.jsx'

<ImageWithFallback
  src={imageUrl}
  alt="Story cover"
  className="h-40 w-full rounded-lg object-cover"
  fallbackText="No image"
/>
```

## PublishStatus (admin only)
```jsx
import { PublishStatus } from './index.jsx'

<PublishStatus published={item.published} />
```
> Public surfaces should not show draft labels; hide draft content instead.
