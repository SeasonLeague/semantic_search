import { type NextRequest, NextResponse } from "next/server"
import { highlightMatches } from "@/lib/text-processing"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const response = await fetch(`${request.nextUrl.origin}/api/python/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error("Failed to perform search")
    }

    const { results } = await response.json()

    const processedResults = results.map((result: any) => {
      const highlights = highlightMatches(result.content, query)
      return {
        ...result,
        highlights,
      }
    })

    return NextResponse.json({ results: processedResults })
  } catch (error) {
    console.error("Error searching documents:", error)
    return NextResponse.json({ error: "Failed to search documents" }, { status: 500 })
  }
}

