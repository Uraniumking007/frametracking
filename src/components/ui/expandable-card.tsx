import * as React from 'react'

type ExpandableCardProps = {
  title: string
  children: React.ReactNode
  expanded?: React.ReactNode
}

export function ExpandableCard({
  title,
  children,
  expanded,
}: ExpandableCardProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('touchstart', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('touchstart', onClick)
    }
  }, [open])

  return (
    <div className="relative">
      <div className="group cursor-pointer" onClick={() => setOpen(true)}>
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={containerRef}
            className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-slate-600/40 bg-slate-900/90 shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <div className="text-sm font-semibold text-slate-200 truncate">
                {title}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700/60 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(85vh-52px)]">
              {expanded ?? children}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

