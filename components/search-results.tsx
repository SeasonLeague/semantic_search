import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  _id: string
  title: string
  content: string
  score: number
  highlights?: string[]
  tags?: string[]
}

interface SearchResultsProps {
  results: SearchResult[]
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>

      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result._id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{result.title}</CardTitle>
                <Badge variant="outline">{(result.score * 100).toFixed(1)}% match</Badge>
              </div>
              {result.tags && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3">{result.content}</p>

              {result.highlights && result.highlights.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <CardDescription className="mb-2">Matching sections:</CardDescription>
                  <ul className="space-y-2">
                    {result.highlights.map((highlight, index) => (
                      <li
                        key={index}
                        className="text-sm bg-muted p-2 rounded"
                        dangerouslySetInnerHTML={{ __html: highlight }}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

