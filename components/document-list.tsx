"use client"

import { useState, useEffect, useContext } from "react"
import { FileText, Trash2, Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { DocumentContext } from "@/lib/document-context"

export function DocumentList() {
  const { documents, deleteDocument } = useContext(DocumentContext)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    deleteDocument(id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents found. Upload your first document to get started.
      </div>
    )
  }

  return (
    <div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc._id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent/10">
              <FileText className="h-5 w-5 mt-1 text-muted-foreground" />

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{doc.title}</h3>
                <p className="text-sm text-muted-foreground">Added on {formatDate(doc.createdAt)}</p>

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDocument(doc)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{selectedDocument?.title}</DialogTitle>
                      <DialogDescription>Document content and details</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 whitespace-pre-wrap">{selectedDocument?.content}</div>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>

                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc._id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

