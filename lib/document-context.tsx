"use client"

import React, { createContext, useState, useEffect, useMemo } from "react"
import { extractKeywords, extractPhrases } from "./text-processing"

const INITIAL_DOCUMENTS = [
  {
    _id: "1",
    title: "Introduction to Machine Learning",
    content:
      "Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.",
    tags: ["AI", "ML", "Data Science"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
  },
  {
    _id: "2",
    title: "Neural Networks Explained",
    content:
      "Neural networks are a series of algorithms that mimic the operations of a human brain to recognize relationships between vast amounts of data.",
    tags: ["AI", "Neural Networks", "Deep Learning"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
  },
  {
    _id: "3",
    title: "Natural Language Processing Techniques",
    content:
      "Natural language processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language.",
    tags: ["NLP", "AI", "Linguistics"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    _id: "4",
    title: "Introduction to Deep Learning Techniques",
    content:
      "Deep Learning (DL) is a subfield of Machine Learning that focuses on the use of Artificial Neural Networks (ANNs) to analyze and intercept data. Inspired by the structure and function of the human brain. Deep Learning algorithms are designed to learn and improve on their own by automatically adjusting the connections between nodes or "Neurons" in the network.",
    tags: ["Deep Learning", "DL", "ANNs"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
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
  
  
  const contentKeywords = useMemo(() => {
    if (documents.length === 0) return []
    
    
    const allContent = documents.map(doc => doc.content).join(" ")
    return extractKeywords(allContent, 50)
  }, [documents])
  
  const contentPhrases = useMemo(() => {
    if (documents.length === 0) return []
    
   
    const allContent = documents.map(doc => doc.content).join(" ")
    return extractPhrases(allContent, 20)
  }, [documents])
  
  const allTags = useMemo(() => {
    if (documents.length === 0) return []
    
    
    const tagSet = new Set<string>()
    documents.forEach(doc => {
      doc.tags.forEach(tag => tagSet.add(tag.toLowerCase()))
    })
    
    return Array.from(tagSet)
  }, [documents])

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        
        const savedDocuments = localStorage.getItem('semantic_search_documents')
        if (savedDocuments) {
          setDocuments(JSON.parse(savedDocuments))
        } else {
          setDocuments(INITIAL_DOCUMENTS)
        }
        
        
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

  
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('semantic_search_documents', JSON.stringify(documents))
    }
  }, [documents, isInitialized])

  
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

    
    const phrases: string[] = []
    const phraseMatches = query.match(/"([^"]+)"/g)
    if (phraseMatches) {
      phraseMatches.forEach(match => {
        
        const phrase = match.slice(1, -1).trim()
        if (phrase.length > 0) {
          phrases.push(phrase)
        }
      })
    }
    
    
    const remainingText = query.replace(/"([^"]+)"/g, '').trim()
    const queryTerms = remainingText.toLowerCase().split(/\s+/)
    
    const results = documents
      .map(doc => {
       
        const titleMatches = queryTerms.filter(term => 
          doc.title.toLowerCase().includes(term)
        ).length
        
        const contentMatches = queryTerms.filter(term => 
          doc.content.toLowerCase().includes(term)
        ).length
        
        const tagMatches = queryTerms.filter(term => 
          doc.tags.some(tag => tag.toLowerCase().includes(term))
        ).length
        
        
        const phraseMatches = phrases.filter(phrase => 
          doc.content.toLowerCase().includes(phrase.toLowerCase()) || 
          doc.title.toLowerCase().includes(phrase.toLowerCase())
        ).length * 2 // Double weight for phrases
        
        
        const score = (
          titleMatches * 3 + 
          contentMatches + 
          tagMatches * 2 + 
          phraseMatches * 3
        ) / ((queryTerms.length + phrases.length) * 6)
        
        
        const highlights: string[] = []
        
        
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
            
            
            for (const phrase of phrases) {
              const phraseRegex = new RegExp(`(${escapeRegExp(phrase)})`, 'gi')
              highlightedSentence = highlightedSentence.replace(
                phraseRegex,
                '<span class="bg-yellow-300 dark:bg-yellow-800 font-medium">$1</span>'
              )
            }
            
            
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
     
      const existingIndex = prev.findIndex(item => item.query.toLowerCase() === trimmedQuery)
      
      if (existingIndex >= 0) {
       
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1,
          lastSearched: new Date().toISOString()
        }
        return updated
      } else {
        
        return [
          {
            query: trimmedQuery,
            count: 1,
            lastSearched: new Date().toISOString()
          },
          ...prev
        ].slice(0, 50) 
      }
    })
  }

  const getSuggestions = (prefix: string): Suggestion[] => {
    if (!prefix || prefix.length < 2) return []
    
    const lowerPrefix = prefix.toLowerCase()
    const suggestions: Suggestion[] = []
    
   
    const historyMatches = searchHistory
      .filter(item => item.query.toLowerCase().includes(lowerPrefix))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) 
    
    suggestions.push(...historyMatches.map(item => ({
      text: item.query,
      type: 'history' as const,
      count: item.count,
      lastSearched: item.lastSearched
    })))
    
    
    const keywordMatches = contentKeywords
      .filter(keyword => keyword.includes(lowerPrefix))
      .slice(0, 3) 
    
    suggestions.push(...keywordMatches.map(keyword => ({
      text: keyword,
      type: 'keyword' as const
    })))
    
    
    const phraseMatches = contentPhrases
      .filter(phrase => phrase.includes(lowerPrefix))
      .slice(0, 2) 
    
    suggestions.push(...phraseMatches.map(phrase => ({
      text: phrase,
      type: 'phrase' as const
    })))
    
    
    const tagMatches = allTags
      .filter(tag => tag.includes(lowerPrefix))
      .slice(0, 2) 
    
    suggestions.push(...tagMatches.map(tag => ({
      text: tag,
      type: 'tag' as const
    })))
    
    
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


function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
