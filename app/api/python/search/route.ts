import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const documents = await db
      .collection("documents")
      .find({})
      .project({ _id: 1, title: 1, content: 1, tags: 1 })
      .toArray()

    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFile = path.join(tempDir, `search_${Date.now()}.json`)
    fs.writeFileSync(
      tempFile,
      JSON.stringify({
        documents,
        query,
      }),
    )

    const searchResults = await runPythonScript(tempFile)

    fs.unlinkSync(tempFile)

    return NextResponse.json({ results: searchResults })
  } catch (error) {
    console.error("Error in Python search service:", error)
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 })
  }
}

async function runPythonScript(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(process.cwd(), "python", "search.py"), filePath])

    let result = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python script error:", errorOutput)
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`))
        return
      }

      try {
        const searchResults = JSON.parse(result)
        resolve(searchResults)
      } catch (error) {
        reject(new Error("Failed to parse search results"))
      }
    })
  })
}

