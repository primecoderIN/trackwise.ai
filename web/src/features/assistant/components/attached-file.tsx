// A component of the assistant feature: an attached receipt chip with optional thumbnail preview for image files
// before sending and a remove button. Used by ChatComposer and ChatMessageBubble.

import { FileText, Paperclip, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"

import { cn } from "@/shared/lib/utils"

interface AttachedFileProps {
  /** The file's name: the user's own data, shown as it is. */
  name: string
  /** Optional local File object (in composer) used to show an image thumbnail preview. */
  file?: File
  /** In the composer: removes the attachment before it's sent. Left out in a sent message. */
  onRemove?: () => void
}

/** One attached receipt chip with thumbnail preview for image uploads and accessible remove action. */
export function AttachedFile({ name, file, onRemove }: AttachedFileProps) {
  const t = useTranslations("assistant")
  const imgRef = useRef<HTMLImageElement>(null)
  const isImage = Boolean(file && file.type.startsWith("image/"))
  const isPdf = name.toLowerCase().endsWith(".pdf")

  useEffect(() => {
    if (!file || !isImage) return
    const url = URL.createObjectURL(file)
    if (imgRef.current) imgRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-xl border border-border/80 px-2.5 py-1.5 text-xs shadow-2xs",
        "bg-muted/40 text-foreground",
      )}
    >
      {isImage ? (
        <img ref={imgRef} alt="" className="size-7 shrink-0 rounded-md border object-cover" />
      ) : isPdf ? (
        <FileText className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <span className="truncate font-medium" title={name}>
        <span className="sr-only">{t("transcript.attached", { name })}</span>
        <span aria-hidden="true">{name}</span>
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("composer.removeAttachment", { name })}
          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  )
}
