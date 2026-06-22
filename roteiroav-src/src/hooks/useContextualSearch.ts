import { useState, useCallback, useRef, useEffect } from 'react';
import { ContextualSearchEngine } from '@/lib/search/search-engine';
import { SearchItem, SearchResult } from '@/lib/search/types';

interface UseSearchOptions {
  debounceMs?: number;
  minChars?: number;
  enableSemantic?: boolean;
}

export function useContextualSearch(items: SearchItem[], options: UseSearchOptions = {}) {
  const { debounceMs = 150, minChars = 2, enableSemantic = false } = options;
  
  const engineRef = useRef<ContextualSearchEngine>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Inicializa engine
  useEffect(() => {
    const init = async () => {
      engineRef.current = new ContextualSearchEngine();
      if (enableSemantic) {
        await engineRef.current.initEmbeddings();
      }
      // Indexa todos os itens
      for (const item of items) {
        await engineRef.current.addItem(item);
      }
    };
    init();
  }, [items, enableSemantic]);

  // Busca com debounce
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    if (debounceRef.current) {
        clearTimeout(debounceRef.current);
    }
    
    if (newQuery.length < minChars) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    // Autocomplete imediato
    if (engineRef.current) {
      setSuggestions(engineRef.current.getSuggestions(newQuery, 5));
    }

    debounceRef.current = setTimeout(async () => {
      if (!engineRef.current) return;
      
      setIsLoading(true);
      const searchResults = await engineRef.current.search(newQuery, {
        limit: 20,
        includeSemantic: enableSemantic
      });
      
      setResults(searchResults);
      setIsLoading(false);
    }, debounceMs);
  }, [minChars, debounceMs, enableSemantic]);

  return {
    query,
    results,
    suggestions,
    isLoading,
    search,
    setQuery
  };
}
