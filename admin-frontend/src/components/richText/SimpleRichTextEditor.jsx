export default function SimpleRichTextEditor({ value, onChange, onUploadImage, textareaId = 'rich-body' }) {
  const wrapSelection = (prefix, suffix = prefix) => {
    const textarea = document.getElementById(textareaId)
    if (!textarea) return
    const { selectionStart, selectionEnd } = textarea
    const selected = value.slice(selectionStart, selectionEnd)
    const next = `${value.slice(0, selectionStart)}${prefix}${selected}${suffix}${value.slice(selectionEnd)}`
    onChange(next)
  }

  const insertBlock = (html) => onChange(`${value || ''}\n${html}`)

  const insertImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !onUploadImage) return
    const imageUrl = await onUploadImage(file)
    if (!imageUrl) return

    const caption = window.prompt('Caption (optional)') || ''
    insertBlock(`<figure><img src="${imageUrl}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`)
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<strong>', '</strong>')}>Bold</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<em>', '</em>')}>Italic</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<u>', '</u>')}>Underline</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<h2>', '</h2>')}>H2</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<h3>', '</h3>')}>H3</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<ul><li>', '</li></ul>')}>Bullets</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<ol><li>', '</li></ol>')}>Numbered</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<blockquote>', '</blockquote>')}>Quote</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<a href="https://">', '</a>')}>Link</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<p style="text-align:left">', '</p>')}>Align Left</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<p style="text-align:center">', '</p>')}>Align Center</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<p style="text-align:right">', '</p>')}>Align Right</button>
        <label className="cursor-pointer rounded border px-2 py-1">Insert Image<input type="file" accept="image/*" className="hidden" onChange={insertImage} /></label>
      </div>
      <textarea id={textareaId} rows={16} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded border px-3 py-2" />
    </div>
  )
}
