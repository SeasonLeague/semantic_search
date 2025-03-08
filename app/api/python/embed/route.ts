import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Create a temporary file to store the text
    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFile = path.join(tempDir, `text_${Date.now()}.txt`)
    fs.writeFileSync(tempFile, text)

    // Run the Python script to generate embeddings
    const embedding = await runPythonScript(tempFile)

    // Clean up the temporary file
    fs.unlinkSync(tempFile)

    return NextResponse.json({ embedding })
  } catch (error) {
    console.error("Error in Python embedding service:", error)
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}

async function runPythonScript(filePath: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(process.cwd(), "python", "embed.py"), filePath])

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
        const embedding = JSON.parse(result)
        resolve(embedding)
      } catch (error) {
        reject(new Error("Failed to parse embedding result"))
      }
    })
  })
}

