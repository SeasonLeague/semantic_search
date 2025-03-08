import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const fileExt = file.name.split(".").pop() || ""
    const tempFilePath = path.join(tempDir, `${uuidv4()}.${fileExt}`)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(tempFilePath, buffer)

    const text = await runPythonParser(tempFilePath)

    try {
      fs.unlinkSync(tempFilePath)
    } catch (error) {
      console.error("Error cleaning up temp file:", error)
    }

    return NextResponse.json({
      success: true,
      text,
      fileType: file.type,
      fileName: file.name,
    })
  } catch (error) {
    console.error("Error parsing document:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse document",
      },
      { status: 500 },
    )
  }
}

async function runPythonParser(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(process.cwd(), "python", "document_parser.py"), filePath])

    let result = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
      console.error("Python stderr:", errorOutput)
    })

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python script error:", errorOutput)
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`))
        return
      }

      try {
        const { text } = JSON.parse(result)
        resolve(text)
      } catch (error) {
        console.error("Error parsing Python output:", error, "Raw output:", result)
        reject(new Error("Failed to parse document parsing result"))
      }
    })
  })
}

