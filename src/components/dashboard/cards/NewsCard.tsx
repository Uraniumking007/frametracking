import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { safeText } from '@/lib/helpers/helpers'
import { fetchNews, Platform } from '@/lib/warframe/api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'

export function NewsCard({ platform }: { platform: Platform }) {
  const [showCommunity, setShowCommunity] = useState(false)

  const news = useQuery({
    queryKey: ['wf', platform, 'news'],
    queryFn: () => fetchNews(platform),
    staleTime: 10 * 60_000, // 10 minutes - news updates infrequently
  })

  // Filter news based on community/news selection
  const filteredNews =
    news.data?.filter((n: any) =>
      showCommunity ? n.community : !n.community,
    ) || []
  return (
    <ExpandableCard
      title={`${showCommunity ? 'Community' : 'News'} & Updates`}
      expanded={
        <NewsExpanded
          isLoading={news.isLoading}
          data={news.data}
          showCommunity={showCommunity}
          onToggleCommunity={() => setShowCommunity((c) => !c)}
        />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 flex flex-col h-72 md:h-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              {showCommunity ? 'Community' : 'News'} & Updates
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="news-toggle" className="text-xs text-slate-300">
                {showCommunity ? 'Community' : 'News'}
              </Label>
              <Switch
                id="news-toggle"
                checked={showCommunity}
                onCheckedChange={() => setShowCommunity((c) => !c)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pr-4">
          {news.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 bg-slate-700" />
              <Skeleton className="h-4 w-2/3 bg-slate-700" />
              <Skeleton className="h-4 w-1/2 bg-slate-700" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNews.slice(0, 5).map((n: any) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      n.community
                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                    }`}
                  >
                    {n.community ? 'Community' : 'News'}
                  </Badge>
                  <span className="text-sm text-slate-200 leading-relaxed">
                    {safeText(n.title) || String(n.title || '')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function NewsExpanded({
  isLoading,
  data,
  showCommunity,
  onToggleCommunity,
}: {
  isLoading: boolean
  data?: any[]
  showCommunity: boolean
  onToggleCommunity: () => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4 bg-slate-700" />
        <Skeleton className="h-4 w-2/3 bg-slate-700" />
        <Skeleton className="h-4 w-1/2 bg-slate-700" />
      </div>
    )
  }

  // Filter news based on community/news selection
  const filteredNews =
    data?.filter((n: any) => (showCommunity ? n.community : !n.community)) || []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Label
          htmlFor="news-toggle-expanded"
          className="text-xs text-slate-300"
        >
          {showCommunity ? 'Community' : 'News'}
        </Label>
        <Switch
          id="news-toggle-expanded"
          checked={showCommunity}
          onCheckedChange={onToggleCommunity}
        />
      </div>
      <div className="space-y-3">
        {filteredNews.map((n: any) => (
          <div
            key={n.id}
            className="flex items-start gap-3 p-2 rounded-lg bg-slate-700/30"
          >
            <Badge
              variant="secondary"
              className={`text-xs ${
                n.community
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
              }`}
            >
              {n.community ? 'Community' : 'News'}
            </Badge>

            <Link to={n.url || ''}>
              <span className="text-sm text-slate-200 leading-relaxed">
                {safeText(n.title) || String(n.title || '')}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

