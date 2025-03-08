// Function to highlight matching parts of text for search results
export function highlightMatches(text: string, query: string): string[] {
  // Split query into words and phrases for matching
  const phrases: string[] = []
  const words: string[] = []
  
  // Extract phrases in quotes
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
  const wordMatches = remainingText
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2) // Only use words with 3+ characters
  
  words.push(...wordMatches)
  
  if (words.length === 0 && phrases.length === 0) {
    return [text.substring(0, 200) + "..."] // Return first 200 chars if no valid query words
  }
  
  // Find paragraphs or sentences that contain query words or phrases
  const paragraphs = text.split(/\n+/)
  const matches: string[] = []
  
  // Look for matches in each paragraph
  for (const paragraph of paragraphs) {
    const paragraphLower = paragraph.toLowerCase()
    
    // Check if paragraph contains any query word or phrase
    const hasWordMatch = words.some(word => paragraphLower.includes(word))
    const hasPhraseMatch = phrases.some(phrase => 
      paragraphLower.includes(phrase.toLowerCase())
    )
    
    if (hasWordMatch || hasPhraseMatch) {
      // Create highlighted version of the paragraph
      let highlightedParagraph = paragraph
      
      // Highlight each phrase first (to avoid word highlighting breaking phrases)
      for (const phrase of phrases) {
        const phraseRegex = new RegExp(`(${escapeRegExp(phrase)})`, 'gi')
        highlightedParagraph = highlightedParagraph.replace(
          phraseRegex,
          '<span class="bg-yellow-300 dark:bg-yellow-800 font-medium">$1</span>'
        )
      }
      
      // Highlight each word
      for (const word of words) {
        // Use word boundary to match whole words only
        const wordRegex = new RegExp(`\\b(${escapeRegExp(word)})\\b`, 'gi')
        highlightedParagraph = highlightedParagraph.replace(
          wordRegex,
          '<span class="bg-yellow-200 dark:bg-yellow-900">$1</span>'
        )
      }
      
      // Add to matches
      matches.push(highlightedParagraph)
      
      // Limit to 3 matching paragraphs
      if (matches.length >= 3) break
    }
  }
  
  // If no paragraph matches, try to find sentences with matches
  if (matches.length === 0) {
    const sentences = text.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (trimmedSentence.length < 10) continue // Skip very short sentences
      
      const sentenceLower = trimmedSentence.toLowerCase()
      
      // Check if sentence contains any query word or phrase
      const hasWordMatch = words.some(word => sentenceLower.includes(word))
      const hasPhraseMatch = phrases.some(phrase => 
        sentenceLower.includes(phrase.toLowerCase())
      )
      
      if (hasWordMatch || hasPhraseMatch) {
        // Create highlighted version of the sentence
        let highlightedSentence = trimmedSentence
        
        // Highlight each phrase first
        for (const phrase of phrases) {
          const phraseRegex = new RegExp(`(${escapeRegExp(phrase)})`, 'gi')
          highlightedSentence = highlightedSentence.replace(
            phraseRegex,
            '<span class="bg-yellow-300 dark:bg-yellow-800 font-medium">$1</span>'
          )
        }
        
        // Highlight each word
        for (const word of words) {
          const wordRegex = new RegExp(`\\b(${escapeRegExp(word)})\\b`, 'gi')
          highlightedSentence = highlightedSentence.replace(
            wordRegex,
            '<span class="bg-yellow-200 dark:bg-yellow-900">$1</span>'
          )
        }
        
        // Add to matches
        matches.push(highlightedSentence)
        
        // Limit to 3 matching sentences
        if (matches.length >= 3) break
      }
    }
  }
  
  // If still no matches, find partial matches for words
  if (matches.length === 0 && words.length > 0) {
    const sentences = text.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (trimmedSentence.length < 10) continue
      
      const sentenceLower = trimmedSentence.toLowerCase()
      
      // Check for partial word matches
      const hasPartialMatch = words.some(word => {
        // For short words (3-4 chars), require exact match
        if (word.length <= 4) {
          return new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(sentenceLower)
        }
        // For longer words, allow partial matches (at least 4 chars)
        return new RegExp(escapeRegExp(word.substring(0, Math.min(4, word.length))), 'i').test(sentenceLower)
      })
      
      if (hasPartialMatch) {
        let highlightedSentence = trimmedSentence
        
        // Highlight partial matches
        for (const word of words) {
          if (word.length <= 4) {
            // Exact match for short words
            const wordRegex = new RegExp(`\\b(${escapeRegExp(word)})\\b`, 'gi')
            highlightedSentence = highlightedSentence.replace(
              wordRegex,
              '<span class="bg-yellow-200 dark:bg-yellow-900">$1</span>'
            )
          } else {
            // Partial match for longer words (highlight the matching part)
            const partialRegex = new RegExp(`(\\b\\w*${escapeRegExp(word.substring(0, Math.min(4, word.length)))}\\w*\\b)`, 'gi')
            highlightedSentence = highlightedSentence.replace(
              partialRegex,
              '<span class="bg-yellow-100 dark:bg-yellow-950">$1</span>'
            )
          }
        }
        
        matches.push(highlightedSentence)
        if (matches.length >= 3) break
      }
    }
  }
  
  // If still no matches, just return the first part of the text
  if (matches.length === 0) {
    return [text.substring(0, 200) + "..."]
  }
  
  return matches
}

// Helper function to escape special characters in regex
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Function to extract keywords from text for auto-suggestions
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Remove common punctuation and convert to lowercase
  const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
  
  // Split into words
  const words = cleanText.split(/\s+/)
  
  // Filter out common stop words and short words
  const stopWords = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", 
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", 
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", 
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", 
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", 
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", 
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", 
    "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", 
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", 
    "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", 
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", 
    "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", 
    "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", 
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", 
    "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", 
    "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", 
    "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
  ])
  
  const filteredWords = words.filter(word => 
    word.length > 3 && !stopWords.has(word)
  )
  
  // Count word frequencies
  const wordCounts: Record<string, number> = {}
  for (const word of filteredWords) {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  }
  
  // Sort by frequency and get top keywords
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

// Function to extract phrases (2-3 word combinations) that appear frequently
export function extractPhrases(text: string, maxPhrases: number = 5): string[] {
  // Remove common punctuation and convert to lowercase
  const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
  
  // Split into words
  const words = cleanText.split(/\s+/)
  
  // Filter out common stop words
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", 
    "be", "been", "being", "to", "of", "in", "for", "with", "by", "at", 
    "this", "that", "these", "those", "it", "its"
  ])
  
  const filteredWords = words.filter(word => 
    word.length > 2 && !stopWords.has(word)
  )
  
  // Generate 2-3 word phrases
  const phrases: Record<string, number> = {}
  
  // 2-word phrases
  for (let i = 0; i < filteredWords.length - 1; i++) {
    const phrase = `${filteredWords[i]} ${filteredWords[i + 1]}`
    phrases[phrase] = (phrases[phrase] || 0) + 1
  }
  
  // 3-word phrases
  for (let i = 0; i < filteredWords.length - 2; i++) {
    const phrase = `${filteredWords[i]} ${filteredWords[i + 1]} ${filteredWords[i + 2]}`
    phrases[phrase] = (phrases[phrase] || 0) + 1
  }
  
  // Sort by frequency and get top phrases
  return Object.entries(phrases)
    .filter(([_, count]) => count > 1) // Only phrases that appear more than once
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPhrases)
    .map(([phrase]) => phrase)
}
