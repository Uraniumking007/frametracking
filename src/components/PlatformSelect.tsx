import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Platform } from '@/lib/warframe/api'

const platforms: { label: string; value: Platform }[] = [
  { label: 'PC', value: 'pc' },
  { label: 'PS4', value: 'ps4' },
  { label: 'Xbox', value: 'xb1' },
  { label: 'Switch', value: 'swi' },
]

function getInitialPlatform(): Platform {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('platform') as Platform | null
  const fromStorage =
    (localStorage.getItem('platform') as Platform | null) ?? null
  return fromUrl ?? fromStorage ?? 'pc'
}

export function PlatformSelect() {
  const [value, setValue] = React.useState<Platform>('pc')
  React.useEffect(() => {
    setValue(getInitialPlatform())
  }, [])

  const onChange = (v: Platform) => {
    setValue(v)
    localStorage.setItem('platform', v)
    const url = new URL(window.location.href)
    url.searchParams.set('platform', v)
    history.replaceState(null, '', url.toString())
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Platform" />
      </SelectTrigger>
      <SelectContent>
        {platforms.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

