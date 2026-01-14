import React from 'react'
import { Badge } from './badge.jsx'

export function StatusBadge({ published, status }) {
  const isPublished = status ? status === 'published' : Boolean(published)
  return (
    <Badge variant={isPublished ? 'success' : 'muted'}>
      {isPublished ? 'Published' : 'Draft'}
    </Badge>
  )
}
