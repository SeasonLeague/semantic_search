import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const prefix = searchParams.get("prefix") || ""

    const { db } = await connectToDatabase()

    const suggestions = await db
      .collection("search_history")
      .find({
        query: { $regex: `^${prefix}`, $options: "i" },
      })
      .sort({ count: -1 })
      .limit(5)
      .toArray()

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        query: s.query,
        count: s.count,
      })),
    })
  } catch (error) {
    console.error("Error fetching search suggestions:", error)
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ error: "Valid query is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    await db
      .collection("search_history")
      .updateOne(
        { query: query.trim() },
        { $inc: { count: 1 }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving search query:", error)
    return NextResponse.json({ error: "Failed to save search query" }, { status: 500 })
  }
}

