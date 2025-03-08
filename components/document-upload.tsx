"use client"

import { useState, useContext } from "react"
import { Upload, FileText, Check, AlertCircle, FileType, File, Tag } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TagInput } from "@/components/tag-input"
import { Progress } from "@/components/ui/progress"
import { DocumentContext } from "@/lib/document-context"
import { Badge } from "@/components/ui/badge"

const PARSER_API_URL = process.env.NEXT_PUBLIC_PARSER_API_URL || "https://backend-semantic-search.onrender.com"

export function DocumentUpload() {
  const { addDocument } = useContext(DocumentContext)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [summary, setSummary] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsingStatus, setParsingStatus] = useState("")

  const supportedFileTypes = [
    ".txt", ".pdf", ".doc", ".docx", ".csv", 
    ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".gif"
  ]

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    
    if (ext === 'pdf') return <FileText className="h-4 w-4" />
    if (['doc', 'docx'].includes(ext || '')) return <File className="h-4 w-4" />
    if (['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'gif'].includes(ext || '')) return <FileType className="h-4 w-4" />
    
    return <FileText className="h-4 w-4" />
  }

  const extractTextFromFile = async (file: File): Promise<{ 
    text: string, 
    suggestedTags: string[],
    keywords: string[],
    phrases: string[]
  }> => {
    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            const text = event.target.result as string
            const suggestedTags = extractPotentialTags(text)
            resolve({ 
              text, 
              suggestedTags,
              keywords: [],
              phrases: []
            })
          } else {
            resolve({ 
              text: "", 
              suggestedTags: [],
              keywords: [],
              phrases: []
            })
          }
        }
        reader.readAsText(file)
      })
    }
    
  
    try {
      setParsingStatus(`Sending ${file.name} to parser API...`)
      
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch(`${PARSER_API_URL}/parse`, {
        method: "POST",
        body: formData,
      })
      
      setParsingStatus("Processing response...")
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Server returned ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error occurred")
      }
      
      setParsingStatus("Text extraction complete")
      return { 
        text: data.text, 
        suggestedTags: data.suggested_tags || [],
        keywords: data.keywords || [],
        phrases: data.phrases || []
      }
    } catch (error) {
      console.error("Error parsing document:", error)
      
      
      if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        setParsingStatus("Falling back to browser-based extraction...")
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              const text = event.target.result as string
              resolve({ 
                text, 
                suggestedTags: extractPotentialTags(text),
                keywords: [],
                phrases: []
              })
            } else {
              resolve({ 
                text: "", 
                suggestedTags: [],
                keywords: [],
                phrases: []
              })
            }
          }
          reader.readAsText(file)
        })
      }
      
      throw error
    }
  }

  const generateSummary = (text: string): string => {
    
    if (text.length < 200) return text
    
    
    const paragraphs = text.split(/\n\s*\n/)
    const sentences = text.split(/[.!?]+\s+/)
    
    
    let summary = ""
    if (paragraphs[0] && paragraphs[0].length > 100) {
      summary = paragraphs[0]
    } else {
      
      let currentLength = 0
      for (let i = 0; i < sentences.length && currentLength < 500; i++) {
        summary += sentences[i] + ". "
        currentLength += sentences[i].length
      }
    }
    
    
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const wordFrequency: Record<string, number> = {}
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1
    })
    
    
    const topWords = Object.entries(wordFrequency)
      .filter(([_, count]) => count > 1) // Only words that appear more than once
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
    
    
    if (topWords.length > 0) {
      summary += `\n\nKey terms: ${topWords.join(', ')}`
    }
    
    return summary
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "")
      if (!title) setTitle(fileName)

      setIsParsing(true)
      setParsingStatus("Starting extraction...")
      
      try {
        
        const { 
          text: extractedText, 
          suggestedTags: extractedTags,
          keywords,
          phrases
        } = await extractTextFromFile(selectedFile)
        
        setContent(extractedText)
        
        
        setParsingStatus("Generating summary...")
        const contentSummary = generateSummary(extractedText)
        setSummary(contentSummary)
        
        
        if (extractedTags.length > 0) {
          setSuggestedTags(extractedTags)
          
          
          if (tags.length === 0) {
            setTags(extractedTags.slice(0, 3))
          }
        }
      } catch (error) {
        console.error("Error parsing file:", error)
        setStatus({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to parse document",
        })
      } finally {
        setIsParsing(false)
        setParsingStatus("")
      }
    }
  }
  
  const extractPotentialTags = (text: string): string[] => {
    
    const capitalizedPhrases = text.match(/\b[A-Z][a-z]+ (?:[A-Z][a-z]+ )*[A-Z][a-z]+\b/g) || []
    
    
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const wordFrequency: Record<string, number> = {}
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1
    })
    
    
    const topWords = Object.entries(wordFrequency)
      .filter(([word, _]) => !['this', 'that', 'with', 'from', 'have', 'were'].includes(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
    
   
    const allPotentialTags = [...new Set([
      ...capitalizedPhrases.slice(0, 3),
      ...topWords
    ])]
    
    return allPotentialTags.map(tag => 
      tag.length > 15 ? tag.substring(0, 15) + '...' : tag
    )
  }
  
  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || (!content.trim() && !file)) {
      setStatus({
        type: "error",
        message: "Please provide a title and either content or a file",
      })
      return
    }

    setIsUploading(true)
    setProgress(0)
    setStatus(null)

    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      
     
      const newDocument = {
        _id: Date.now().toString(),
        title,
        content,
        tags,
        createdAt: new Date().toISOString()
      }
      
      addDocument(newDocument)
      
      setStatus({
        type: "success",
        message: "Document uploaded successfully!",
      })

      
      setTimeout(() => {
        setTitle("")
        setContent("")
        setSummary("")
        setTags([])
        setSuggestedTags([])
        setFile(null)
        setProgress(0)
        setIsUploading(false)
      }, 1000)
    }, 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <Alert variant={status.type === "error" ? "destructive" : "default"}>
          {status.type === "error" ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          <AlertTitle>{status.type === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Document Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
          required
        />
      </div>

      {summary && (
        <div className="p-3 bg-muted/50 rounded-md">
          <h3 className="text-sm font-medium mb-1">Content Summary:</h3>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter document content or upload a file"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <TagInput tags={tags} setTags={setTags} />
        
        {suggestedTags.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">Suggested tags:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => addTag(tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Upload File</Label>
        <div className="flex items-center gap-2">
          <Input 
            id="file" 
            type="file" 
            onChange={handleFileChange} 
            className="flex-1" 
            accept={supportedFileTypes.join(",")} 
            disabled={isParsing}
          />
          {file && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getFileIcon(file.name)}
              {file.name}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Supports: TXT, PDF, DOC, DOCX, CSV, and common image formats
        </p>
        {isParsing && (
          <div className="text-sm text-muted-foreground animate-pulse">
            <p>{parsingStatus || "Processing document..."}</p>
            <Progress value={undefined} className="h-1 mt-1" />
          </div>
        )}
      </div>

      {isUploading && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isUploading || isParsing}>
        {isUploading ? (
          <span className="animate-pulse">Uploading...</span>
        ) : isParsing ? (
          <span className="animate-pulse">Processing document...</span>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>
    </form>
  )
}
