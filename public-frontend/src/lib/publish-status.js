export function getPublishStatus(published) {
  if (published) {
    return {
      label: 'Published',
      variant: 'success',
      toneText: 'Published',
    }
  }

  return {
    label: 'Draft',
    variant: 'muted',
    toneText: 'Draft',
  }
}
