/**
 * Advanced search service for admin operations
 * Provides fuzzy search, field-specific searches, and intelligent filtering
 */

export interface SearchableItem {
  id: string
  [key: string]: any
}

export interface SearchField {
  key: string
  weight: number // Higher weight = more important in search results
  type: 'text' | 'number' | 'date' | 'boolean' | 'array'
  searchable?: boolean
  filterable?: boolean
}

export interface SearchOptions {
  fields: SearchField[]
  fuzzyThreshold?: number // 0-1, lower = more strict
  caseSensitive?: boolean
  exactMatch?: boolean
  highlightMatches?: boolean
}

export interface SearchResult<T> {
  item: T
  score: number
  matches: SearchMatch[]
}

export interface SearchMatch {
  field: string
  value: string
  highlighted?: string
  score: number
}

/**
 * Advanced search engine with scoring and fuzzy matching
 */
export class SearchService<T extends SearchableItem> {
  private options: SearchOptions

  constructor(options: SearchOptions) {
    this.options = {
      fuzzyThreshold: 0.6,
      caseSensitive: false,
      exactMatch: false,
      highlightMatches: true,
      ...options
    }
  }

  /**
   * Search through items with advanced scoring
   */
  search(items: T[], query: string): SearchResult<T>[] {
    if (!query.trim()) return items.map(item => ({ item, score: 0, matches: [] }))

    const searchTerms = this.parseQuery(query)
    const results: SearchResult<T>[] = []

    for (const item of items) {
      const matches = this.findMatches(item, searchTerms)
      if (matches.length > 0) {
        const score = this.calculateScore(matches)
        results.push({ item, score, matches })
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * Parse search query into terms and operators
   */
  private parseQuery(query: string): string[] {
    // Handle quoted phrases
    const phrases: string[] = []
    let cleanQuery = query.replace(/"([^"]+)"/g, (match, phrase) => {
      phrases.push(phrase)
      return `__PHRASE_${phrases.length - 1}__`
    })

    // Split on whitespace and restore phrases
    const terms = cleanQuery.split(/\s+/).map(term => {
      const phraseMatch = term.match(/__PHRASE_(\d+)__/)
      if (phraseMatch) {
        return phrases[parseInt(phraseMatch[1])]
      }
      return term
    })

    return terms.filter(term => term.length > 0)
  }

  /**
   * Find all matches for search terms in an item
   */
  private findMatches(item: T, searchTerms: string[]): SearchMatch[] {
    const matches: SearchMatch[] = []

    for (const field of this.options.fields) {
      if (!field.searchable) continue

      const value = item[field.key]
      if (value == null) continue

      const stringValue = this.valueToString(value, field.type)
      
      for (const term of searchTerms) {
        const match = this.findTermMatch(stringValue, term, field)
        if (match) {
          matches.push(match)
        }
      }
    }

    return matches
  }

  /**
   * Find a match for a specific term in a field value
   */
  private findTermMatch(value: string, term: string, field: SearchField): SearchMatch | null {
    const searchValue = this.options.caseSensitive ? value : value.toLowerCase()
    const searchTerm = this.options.caseSensitive ? term : term.toLowerCase()

    let score = 0
    let highlighted = value

    if (this.options.exactMatch) {
      if (searchValue === searchTerm) {
        score = 1.0 * field.weight
      }
    } else {
      // Check for exact substring match first
      const exactIndex = searchValue.indexOf(searchTerm)
      if (exactIndex !== -1) {
        score = this.calculateSubstringScore(searchValue, searchTerm, exactIndex) * field.weight
        
        if (this.options.highlightMatches) {
          const start = exactIndex
          const end = start + searchTerm.length
          highlighted = value.substring(0, start) + 
                      '<mark>' + value.substring(start, end) + '</mark>' + 
                      value.substring(end)
        }
      } else {
        // Fuzzy matching for partial matches
        const fuzzyScore = this.calculateFuzzyScore(searchValue, searchTerm)
        if (fuzzyScore >= (this.options.fuzzyThreshold || 0.6)) {
          score = fuzzyScore * field.weight * 0.7 // Reduce score for fuzzy matches
        }
      }
    }

    return score > 0 ? {
      field: field.key,
      value: value,
      highlighted: this.options.highlightMatches ? highlighted : undefined,
      score
    } : null
  }

  /**
   * Calculate score for substring matches
   */
  private calculateSubstringScore(value: string, term: string, index: number): number {
    // Higher score for matches at the beginning
    const positionScore = index === 0 ? 1.0 : Math.max(0.3, 1.0 - (index / value.length))
    
    // Higher score for longer matches relative to the field length
    const lengthScore = term.length / value.length
    
    // Exact word boundary matches get bonus
    const wordBoundaryBonus = this.isWordBoundary(value, index, term.length) ? 1.2 : 1.0
    
    return Math.min(1.0, positionScore * lengthScore * wordBoundaryBonus)
  }

  /**
   * Calculate fuzzy match score using Levenshtein distance
   */
  private calculateFuzzyScore(value: string, term: string): number {
    const distance = this.levenshteinDistance(value, term)
    const maxLength = Math.max(value.length, term.length)
    return 1 - (distance / maxLength)
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Check if a match is on word boundaries
   */
  private isWordBoundary(value: string, index: number, length: number): boolean {
    const before = index === 0 || !/\w/.test(value[index - 1])
    const after = index + length >= value.length || !/\w/.test(value[index + length])
    return before && after
  }

  /**
   * Convert field value to searchable string
   */
  private valueToString(value: any, type: SearchField['type']): string {
    switch (type) {
      case 'text':
        return String(value)
      case 'number':
        return String(value)
      case 'date':
        return new Date(value).toLocaleDateString() + ' ' + new Date(value).toISOString()
      case 'boolean':
        return value ? 'true yes active enabled' : 'false no inactive disabled'
      case 'array':
        return Array.isArray(value) ? value.join(' ') : String(value)
      default:
        return String(value)
    }
  }

  /**
   * Calculate overall score from matches
   */
  private calculateScore(matches: SearchMatch[]): number {
    if (matches.length === 0) return 0

    // Sum all match scores
    const totalScore = matches.reduce((sum, match) => sum + match.score, 0)
    
    // Bonus for multiple field matches
    const uniqueFields = new Set(matches.map(m => m.field)).size
    const diversityBonus = uniqueFields > 1 ? 1.2 : 1.0
    
    // Normalize by number of matches to avoid inflated scores
    return (totalScore / matches.length) * diversityBonus
  }
}

/**
 * Pre-configured search service for transportation requests
 */
export const createOrderSearchService = () => {
  return new SearchService({
    fields: [
      { key: 'order_number', weight: 2.0, type: 'text', searchable: true },
      { key: 'vin_number', weight: 1.8, type: 'text', searchable: true },
      { key: 'pickup_company_name', weight: 1.5, type: 'text', searchable: true },
      { key: 'delivery_company_name', weight: 1.5, type: 'text', searchable: true },
      { key: 'pickup_contact_name', weight: 1.2, type: 'text', searchable: true },
      { key: 'delivery_contact_name', weight: 1.2, type: 'text', searchable: true },
      { key: 'pickup_contact_phone', weight: 1.0, type: 'text', searchable: true },
      { key: 'delivery_contact_phone', weight: 1.0, type: 'text', searchable: true },
      { key: 'vehicle_make', weight: 1.3, type: 'text', searchable: true },
      { key: 'vehicle_model', weight: 1.3, type: 'text', searchable: true },
      { key: 'vehicle_year', weight: 1.0, type: 'number', searchable: true },
      { key: 'status', weight: 1.4, type: 'text', searchable: true },
      { key: 'notes', weight: 0.8, type: 'text', searchable: true },
      { key: 'created_at', weight: 0.5, type: 'date', searchable: true }
    ],
    fuzzyThreshold: 0.7,
    caseSensitive: false,
    exactMatch: false,
    highlightMatches: true
  })
}

/**
 * Smart filter functions for advanced filtering
 */
export class FilterService {
  /**
   * Apply date range filter
   */
  static dateRange<T extends { [key: string]: any }>(
    items: T[],
    field: string,
    start?: string,
    end?: string
  ): T[] {
    return items.filter(item => {
      const itemDate = new Date(item[field])
      if (isNaN(itemDate.getTime())) return false
      
      if (start) {
        const startDate = new Date(start)
        if (itemDate < startDate) return false
      }
      
      if (end) {
        const endDate = new Date(end)
        endDate.setHours(23, 59, 59, 999)
        if (itemDate > endDate) return false
      }
      
      return true
    })
  }

  /**
   * Apply multi-value filter (OR logic)
   */
  static multiValue<T extends { [key: string]: any }>(
    items: T[],
    field: string,
    values: string[]
  ): T[] {
    if (values.length === 0) return items
    return items.filter(item => values.includes(item[field]))
  }

  /**
   * Apply number range filter
   */
  static numberRange<T extends { [key: string]: any }>(
    items: T[],
    field: string,
    min?: number,
    max?: number
  ): T[] {
    return items.filter(item => {
      const value = Number(item[field])
      if (isNaN(value)) return false
      
      if (min !== undefined && value < min) return false
      if (max !== undefined && value > max) return false
      
      return true
    })
  }

  /**
   * Apply boolean filter
   */
  static boolean<T extends { [key: string]: any }>(
    items: T[],
    field: string,
    value: boolean
  ): T[] {
    return items.filter(item => Boolean(item[field]) === value)
  }
}