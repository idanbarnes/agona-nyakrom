import React from 'react'
import { cn } from '../../lib/cn.js'
import { getPublishStatus } from '../../lib/publish-status.js'
import { Badge } from './badge.jsx'

export function PublishStatus({ published, showText = true, className }) {
  const { label, variant } = getPublishStatus(Boolean(published))

  return (
    <Badge variant={variant} className={cn(showText ? '' : 'px-2', className)}>
      {showText ? label : null}
    </Badge>
  )
}
