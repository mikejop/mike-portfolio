export interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  popularity: number; // score de popularidade (0-100)
  createdAt: Date;
  vector?: number[]; // embedding semantico
}

export interface SearchResult {
  item: SearchItem;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'prefix';
  highlights: {
    title?: string;
    description?: string;
    category?: string;
  };
}

export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  items: Set<string>; // IDs dos itens
  frequency: number; // frequência de busca
}

export interface SearchOptions {
  limit?: number;
  includeSemantic?: boolean;
  userLocation?: string;
  userHistory?: string[];
}
