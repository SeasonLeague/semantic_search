"use client"

import { useState, useEffect, useRef, useContext } from "react"
import { Search, X, Clock, Hash, Key, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchResults } from "@/components/search-results"
import { DocumentContext } from "@/lib/document-context"
import { useDebounce } from "@/lib/hooks"

export function SearchBar() {
  const { searchDocuments, getSuggestions, addSearchQuery } = useContext(DocumentContext)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Debounce the query to avoid excessive suggestion updates
  const debouncedQuery = useDebounce(query, 200)

  // Update suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }

    const searchSuggestions = getSuggestions(debouncedQuery)
    setSuggestions(searchSuggestions)
    
    // Reset active suggestion index when suggestions change
    setActiveSuggestionIndex(-1)
  }, [debouncedQuery, getSuggestions])

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If no suggestions are shown, don't handle navigation keys
    if (!showSuggestions || suggestions.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : -1
        )
        break
      case 'Enter':
        // If a suggestion is active, select it
        if (activeSuggestionIndex >= 0) {
          e.preventDefault()
          handleSelectSuggestion(suggestions[activeSuggestionIndex].text)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)

    // Add to search history
    addSearchQuery(query)

    // Perform search
    setTimeout(() => {
      const { results: searchResults } = searchDocuments(query)
      setResults(searchResults)
      setIsSearching(false)
    }, 500)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    
    // Search with the selected suggestion
    setIsSearching(true)
    
    // Add to search history
    addSearchQuery(suggestion)
    
    setTimeout(() => {
      const { results: searchResults } = searchDocuments(suggestion)
      setResults(searchResults)
      setIsSearching(false)
    }, 500)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }
  
  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history':
        return <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
      case 'tag':
        return <Hash className="h-3 w-3 mr-2 text-blue-500" />
      case 'keyword':
        return <Key className="h-3 w-3 mr-2 text-green-500" />
      case 'phrase':
        return <MessageSquare className="h-3 w-3 mr-2 text-purple-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex w-full max-w-3xl mx-auto gap-2 relative">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            autoComplete="off"
          />
          {query.length > 0 && (
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute w-full mt-1 bg-card border rounded-md shadow-lg z-10"
            >
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className={`px-4 py-2 cursor-pointer ${
                      index === activeSuggestionIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion.text)}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {getSuggestionIcon(suggestion.type)}
                        <span>{suggestion.text}</span>
                      </div>
                      {suggestion.type === 'history' && (
                        <div className="flex flex-col items-end text-xs text-muted-foreground">
                          <span>{suggestion.count} {suggestion.count === 1 ? 'search' : 'searches'}</span>
                          <span>{formatDate(suggestion.lastSearched)}</span>
                        </div>
                      )}
                      {suggestion.type === 'tag' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Tag</span>
                      )}
                      {suggestion.type === 'keyword' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Keyword</span>
                      )}
                      {suggestion.type === 'phrase' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Phrase</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <span className="animate-pulse">Searching...</span>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {results.length > 0 && <SearchResults results={results} />}
    </div>
  )
}
