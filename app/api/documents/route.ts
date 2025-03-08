import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { createEmbedding } from "@/lib/embeddings"

export async function GET(request: Request): Promise<Response> {
  try {
    const { db } = await connectToDatabase()

    const documents = await db.collection("documents").find({}).sort({ createdAt: -1 }).limit(10).toArray()

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const tagsJson = formData.get("tags") as string
    const tags = JSON.parse(tagsJson || "[]")

    const file = formData.get("file") as File | null
    let fileContent = ""

    if (file) {
      fileContent = await file.text()
    }

    const documentContent = fileContent || content

    if (!title || !documentContent) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const embedding = await createEmbedding(documentContent)

    const { db } = await connectToDatabase()

    const result = await db.collection("documents").insertOne({
      title,
      content: documentContent,
      tags,
      embedding,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      documentId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}

