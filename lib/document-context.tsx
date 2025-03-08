"use client"

import React, { createContext, useState, useEffect, useMemo } from "react"
import { extractKeywords, extractPhrases } from "./text-processing"

// Initial mock documents
const INITIAL_DOCUMENTS = [
  {
    _id: "1",
    title: "Introduction to Machine Learning",
    content:
      "Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.",
    tags: ["AI", "ML", "Data Science"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    _id: "2",
    title: "Neural Networks Explained",
    content:
      "Neural networks are a series of algorithms that mimic the operations of a human brain to recognize relationships between vast amounts of data.",
    tags: ["AI", "Neural Networks", "Deep Learning"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    _id: "3",
    title: "Natural Language Processing Techniques",
    content:
      "Natural language processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language.",
    tags: ["NLP", "AI", "Linguistics"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
]

export interface Document {
  _id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

interface SearchHistory {
  query: string
  count: number
  lastSearched: string
}

interface Suggestion {
  text: string
  type: 'history' | 'keyword' | 'phrase' | 'tag'
  count?: number
  lastSearched?: string
}

interface DocumentContextType {
  documents: Document[]
  addDocument: (document: Document) => void
  deleteDocument: (id: string) => void
  searchDocuments: (query: string) => { results: any[], query: string }
  searchHistory: SearchHistory[]
  addSearchQuery: (query: string) => void
  getSuggestions: (prefix: string) => Suggestion[]
  contentKeywords: string[]
  contentPhrases: string[]
  allTags: string[]
}

export const DocumentContext = createContext<DocumentContextType>({
  documents: [],
  addDocument: () => {},
  deleteDocument: () => {},
  searchDocuments: () => ({ results: [], query: "" }),
  searchHistory: [],
  addSearchQuery: () => {},
  getSuggestions: () => [],
  contentKeywords: [],
  contentPhrases: [],
  allTags: []
})

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Extract keywords, phrases, and tags from all documents
  const contentKeywords = useMemo(() => {
    if (documents.length === 0) return []
    
    // Combine all document content
    const allContent = documents.map(doc => doc.content).join(" ")
    return extractKeywords(allContent, 50)
  }, [documents])
  
  const contentPhrases = useMemo(() => {
    if (documents.length === 0) return []
    
    // Combine all document content
    const allContent = documents.map(doc => doc.content).join(" ")
    return extractPhrases(allContent, 20)
  }, [documents])
  
  const allTags = useMemo(() => {
    if (documents.length === 0) return []
    
    // Get unique tags from all documents
    const tagSet = new Set<string>()
    documents.forEach(doc => {
      doc.tags.forEach(tag => tagSet.add(tag.toLowerCase()))
    })
    
    return Array.from(tagSet)
  }, [documents])

  // Load documents and search history from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load documents
        const savedDocuments = localStorage.getItem('semantic_search_documents')
        if (savedDocuments) {
          setDocuments(JSON.parse(savedDocuments))
        } else {
          setDocuments(INITIAL_DOCUMENTS)
        }
        
        // Load search history
        const savedHistory = localStorage.getItem('semantic_search_history')
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory))
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error("Error loading data from localStorage:", error)
        setDocuments(INITIAL_DOCUMENTS)
        setIsInitialized(true)
      }
    }
  }, [])

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('semantic_search_documents', JSON.stringify(documents))
    }
  }, [documents, isInitialized])

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('semantic_search_history', JSON.stringify(searchHistory))
    }
  }, [searchHistory, isInitialized])

  const addDocument = (document: Document) => {
    setDocuments(prev => [document, ...prev])
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc._id !== id))
  }

  const searchDocuments = (query: string) => {
    if (!query.trim()) {
      return { results: [], query }
    }

    // Extract phrases in quotes
    const phrases: string[] = []
    const phraseMatches = query.match(/"([^"]+)"/g)
    if (phraseMatches) {
      phraseMatches.forEach(match => {
        // Remove the quotes
        const phrase = match.slice(1, -1).trim()
        if (phrase.length > 0) {
          phrases.push(phrase)
        }
      })
    }
    
    // Get remaining words after removing phrases
    const remainingText = query.replace(/"([^"]+)"/g, '').trim()
    const queryTerms = remainingText.toLowerCase().split(/\s+/)
    
    const results = documents
      .map(doc => {
        // Calculate a simple relevance score
        const titleMatches = queryTerms.filter(term => 
          doc.title.toLowerCase().includes(term)
        ).length
        
        const contentMatches = queryTerms.filter(term => 
          doc.content.toLowerCase().includes(term)
        ).length
        
        const tagMatches = queryTerms.filter(term => 
          doc.tags.some(tag => tag.toLowerCase().includes(term))
        ).length
        
        // Check for phrase matches (higher weight)
        const phraseMatches = phrases.filter(phrase => 
          doc.content.toLowerCase().includes(phrase.toLowerCase()) || 
          doc.title.toLowerCase().includes(phrase.toLowerCase())
        ).length * 2 // Double weight for phrases
        
        // Weight title and tag matches more heavily
        const score = (
          titleMatches * 3 + 
          contentMatches + 
          tagMatches * 2 + 
          phraseMatches * 3
        ) / ((queryTerms.length + phrases.length) * 6)
        
        // Generate highlights
        const highlights: string[] = []
        
        // Find sentences containing query terms
        const sentences = doc.content.split(/[.!?]+/)
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim()
          if (trimmedSentence.length < 10) continue
          
          const sentenceLower = trimmedSentence.toLowerCase()
          const hasTermMatch = queryTerms.some(term => sentenceLower.includes(term))
          const hasPhraseMatch = phrases.some(phrase => 
            sentenceLower.includes(phrase.toLowerCase())
          )
          
          if (hasTermMatch || hasPhraseMatch) {
            let highlightedSentence = trimmedSentence
            
            // Highlight each phrase first
            for (const phrase of phrases) {
              const phraseRegex = new RegExp(`(${escapeRegExp(phrase)})`, 'gi')
              highlightedSentence = highlightedSentence.replace(
                phraseRegex,
                '<span class="bg-yellow-300 dark:bg-yellow-800 font-medium">$1</span>'
              )
            }
            
            // Highlight each query term
            for (const term of queryTerms) {
              if (term.length < 3) continue // Skip very short terms
              
              const regex = new RegExp(`\\b(${escapeRegExp(term)})\\b`, 'gi')
              highlightedSentence = highlightedSentence.replace(
                regex,
                '<span class="bg-yellow-200 dark:bg-yellow-900">$1</span>'
              )
            }
            
            highlights.push(highlightedSentence)
            if (highlights.length >= 3) break
          }
        }
        
        return {
          ...doc,
          score,
          highlights: highlights.length > 0 ? highlights : undefined
        }
      })
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
    
    return { results, query }
  }

  const addSearchQuery = (query: string) => {
    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery) return
    
    setSearchHistory(prev => {
      // Check if this query already exists
      const existingIndex = prev.findIndex(item => item.query.toLowerCase() === trimmedQuery)
      
      if (existingIndex >= 0) {
        // Update existing query
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1,
          lastSearched: new Date().toISOString()
        }
        return updated
      } else {
        // Add new query
        return [
          {
            query: trimmedQuery,
            count: 1,
            lastSearched: new Date().toISOString()
          },
          ...prev
        ].slice(0, 50) // Limit history to 50 items
      }
    })
  }

  const getSuggestions = (prefix: string): Suggestion[] => {
    if (!prefix || prefix.length < 2) return []
    
    const lowerPrefix = prefix.toLowerCase()
    const suggestions: Suggestion[] = []
    
    // 1. Add matching search history items
    const historyMatches = searchHistory
      .filter(item => item.query.toLowerCase().includes(lowerPrefix))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) // Limit to 3 history suggestions
    
    suggestions.push(...historyMatches.map(item => ({
      text: item.query,
      type: 'history' as const,
      count: item.count,
      lastSearched: item.lastSearched
    })))
    
    // 2. Add matching keywords from document content
    const keywordMatches = contentKeywords
      .filter(keyword => keyword.includes(lowerPrefix))
      .slice(0, 3) // Limit to 3 keyword suggestions
    
    suggestions.push(...keywordMatches.map(keyword => ({
      text: keyword,
      type: 'keyword' as const
    })))
    
    // 3. Add matching phrases
    const phraseMatches = contentPhrases
      .filter(phrase => phrase.includes(lowerPrefix))
      .slice(0, 2) // Limit to 2 phrase suggestions
    
    suggestions.push(...phraseMatches.map(phrase => ({
      text: phrase,
      type: 'phrase' as const
    })))
    
    // 4. Add matching tags
    const tagMatches = allTags
      .filter(tag => tag.includes(lowerPrefix))
      .slice(0, 2) // Limit to 2 tag suggestions
    
    suggestions.push(...tagMatches.map(tag => ({
      text: tag,
      type: 'tag' as const
    })))
    
    // Deduplicate and limit to 8 total suggestions
    const uniqueSuggestions: Suggestion[] = []
    const seenTexts = new Set<string>()
    
    for (const suggestion of suggestions) {
      if (!seenTexts.has(suggestion.text)) {
        seenTexts.add(suggestion.text)
        uniqueSuggestions.push(suggestion)
        if (uniqueSuggestions.length >= 8) break
      }
    }
    
    return uniqueSuggestions
  }

  return (
    <DocumentContext.Provider value={{ 
      documents, 
      addDocument, 
      deleteDocument, 
      searchDocuments,
      searchHistory,
      addSearchQuery,
      getSuggestions,
      contentKeywords,
      contentPhrases,
      allTags
    }}>
      {children}
    </DocumentContext.Provider>
  )
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
