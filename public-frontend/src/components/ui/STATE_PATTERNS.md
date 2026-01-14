# State UI Patterns

## State precedence
Always resolve states in this order:
1. **Loading** → render skeletons.
2. **Error** → render `ErrorState`.
3. **Empty** → render `EmptyState`.
4. **Content** → render actual UI.

## List page example
```jsx
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  StateGate,
} from './index.jsx'

<StateGate
  loading={loading}
  error={error}
  isEmpty={!loading && !error && items.length === 0}
  skeleton={<ListSkeleton rows={4} />}
  errorFallback={<ErrorState message={error?.message} />}
  empty={
    <EmptyState
      title="No items yet"
      description="Check back soon for updates."
    />
  }
>
  {/* render list/cards */}
</StateGate>
```

## Detail page example
```jsx
import { DetailSkeleton, StateGate } from './index.jsx'

<StateGate
  loading={loading}
  error={error}
  isEmpty={!loading && !error && !item}
  skeleton={<DetailSkeleton />}
>
  {/* render detail view */}
</StateGate>
```

## Skeleton guidance
- **TableSkeleton**: data tables and admin-like listings.
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
