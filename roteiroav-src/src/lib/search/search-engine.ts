import Fuse from 'fuse.js';
import { SearchItem, SearchResult, TrieNode, SearchOptions } from './types';

export class ContextualSearchEngine {
  private items: Map<string, SearchItem> = new Map();
  private fuse: Fuse<SearchItem>;
  private trieRoot: TrieNode = { children: new Map(), isEndOfWord: false, items: new Set(), frequency: 0 };
  private embeddingModel: any = null;
  private vectorIndex: Map<string, number[]> = new Map();
  
  private fuseOptions = {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'category', weight: 0.3 },
      { name: 'description', weight: 0.1 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.45, // Ligeiramente mais tolerante
    distance: 1000, // Maior distância para multi-palavras em campos diferentes
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
    useExtendedSearch: true,
    ignoreLocation: true,
    findAllMatches: true
  };

  constructor() {
    this.fuse = new Fuse([], this.fuseOptions);
  }

  async initEmbeddings() {
    try {
      const { pipeline } = await import('@xenova/transformers');
      this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (e) {
      console.error('Failed to init embeddings:', e);
    }
  }

  async addItem(item: SearchItem): Promise<void> {
    this.items.set(item.id, item);
    
    this.fuse.setCollection(Array.from(this.items.values()));
    
    this.insertToTrie(item.title, item.id);
    item.tags.forEach(tag => this.insertToTrie(tag, item.id));
    
    if (this.embeddingModel && !item.vector) {
      const text = `${item.title} ${item.description} ${item.tags.join(' ')}`;
      const embedding = await this.generateEmbedding(text);
      this.vectorIndex.set(item.id, embedding);
      item.vector = embedding;
    } else if (item.vector) {
      this.vectorIndex.set(item.id, item.vector);
    }
  }

  private insertToTrie(word: string, itemId: string): void {
    let node = this.trieRoot;
    const normalized = this.normalize(word);
    
    for (const char of normalized) {
      if (!node.children.has(char)) {
        node.children.set(char, { 
          children: new Map(), 
          isEndOfWord: false, 
          items: new Set(),
          frequency: 0 
        });
      }
      node = node.children.get(char)!;
      node.items.add(itemId);
    }
    node.isEndOfWord = true;
    node.frequency++;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { 
      limit = 20, 
      includeSemantic = true,
      userHistory = []
    } = options;

    if (!query.trim()) return [];

    // Pre-processing query: keep spaces for tokenization but normalize characters
    const normalizedQuery = this.normalize(query);
    const resultsMap = new Map<string, SearchResult>();
    
    // 🎯 CAMADA 1: FUZZY SEARCH (Com suporte a multi-tokens)
    const fuzzyResults = this.fuzzySearch(normalizedQuery, limit * 2);
    fuzzyResults.forEach(r => resultsMap.set(r.item.id, r));

    // 🎯 CAMADA 2: PREFIX MATCHING (Apenas para a última palavra ou frase curta)
    const prefixResults = this.prefixSearch(normalizedQuery.split(' ').pop() || normalizedQuery, limit);
    prefixResults.forEach(r => {
      if (resultsMap.has(r.item.id)) {
        const existing = resultsMap.get(r.item.id)!;
        existing.score = Math.max(existing.score, r.score);
        // Não mudamos o matchType para 'exact' aqui para não sobrescrever destaques fuzzy complexos
      } else {
        resultsMap.set(r.item.id, r);
      }
    });

    // 🎯 CAMADA 3: SEMANTIC SEARCH
    if (includeSemantic && this.embeddingModel) {
      const semanticResults = await this.semanticSearch(normalizedQuery, limit);
      semanticResults.forEach(r => {
        if (resultsMap.has(r.item.id)) {
          const existing = resultsMap.get(r.item.id)!;
          existing.score = (existing.score * 0.7) + (r.score * 0.3);
        } else {
          resultsMap.set(r.item.id, r);
        }
      });
    }

    const rankedResults = Array.from(resultsMap.values())
      .map(r => this.applyRankingBoosts(r, query, userHistory))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return rankedResults;
  }

  private fuzzySearch(query: string, limit: number): SearchResult[] {
    // Para buscas multi-palavras como "camera canon", o Fuse.js com extendedSearch: true
    // já trata espaços como AND. No entanto, vamos garantir que o threshold permita
    // o match parcial de cada termo.
    const fuseResults = this.fuse.search(query, { limit });
    
    return fuseResults.map(result => ({
      item: result.item,
      score: 1 - (result.score || 0),
      matchType: (result.score || 1) < 0.1 ? 'exact' : 'fuzzy',
      highlights: this.extractFuzzyHighlights(result.item, result.matches || [])
    }));
  }

  private prefixSearch(prefix: string, limit: number): SearchResult[] {
    const node = this.findTrieNode(this.normalize(prefix));
    if (!node) return [];

    const itemIds = this.collectAllItems(node);
    const results: SearchResult[] = [];

    itemIds.forEach(id => {
      const item = this.items.get(id);
      if (item) {
        const frequencyBoost = node.frequency / 100;
        const popularityBoost = item.popularity / 100;
        
        results.push({
          item,
          score: 0.8 + (frequencyBoost * 0.1) + (popularityBoost * 0.1),
          matchType: 'prefix',
          highlights: {
            title: this.highlightMatch(item.title, prefix)
          }
        });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async semanticSearch(query: string, limit: number): Promise<SearchResult[]> {
    const queryVector = await this.generateEmbedding(query);
    const results: SearchResult[] = [];

    for (const [id, itemVector] of this.vectorIndex) {
      const similarity = this.cosineSimilarity(queryVector, itemVector);
      if (similarity > 0.5) {
        const item = this.items.get(id)!;
        results.push({
          item,
          score: similarity,
          matchType: 'semantic',
          highlights: {
            description: item.description.substring(0, 100) + '...'
          }
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingModel) return [];
    const output = await this.embeddingModel(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private applyRankingBoosts(
    result: SearchResult, 
    query: string, 
    userHistory: string[]
  ): SearchResult {
    let boost = 0;
    boost += (result.item.popularity / 100) * 0.15;

    const daysSinceCreated = (Date.now() - result.item.createdAt.getTime()) / (1000 * 3600 * 24);
    if (daysSinceCreated < 7) boost += 0.1;

    if (userHistory.includes(result.item.category)) {
      boost += 0.1;
    }

    const normalizedTitle = this.normalize(result.item.title);
    const normalizedQuery = this.normalize(query);
    if (normalizedTitle.includes(normalizedQuery)) {
      boost += 0.2;
    }

    result.score = Math.min(1, result.score + boost);
    return result;
  }

  private normalize(str: string): string {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private findTrieNode(prefix: string): TrieNode | null {
    let node = this.trieRoot;
    for (const char of prefix) {
      if (!node.children.has(char)) return null;
      node = node.children.get(char)!;
    }
    return node;
  }

  private collectAllItems(node: TrieNode): Set<string> {
    const items = new Set(node.items);
    for (const child of node.children.values()) {
      const childItems = this.collectAllItems(child);
      childItems.forEach(id => items.add(id));
    }
    return items;
  }

  private extractFuzzyHighlights(item: SearchItem, matches: readonly any[]): SearchResult['highlights'] {
    const highlights: SearchResult['highlights'] = {};
    
    matches.forEach(match => {
      if (match.indices && match.value && match.key) {
        const highlighted = this.applyHighlights(match.value, match.indices);
        if (match.key === 'title') highlights.title = highlighted;
        if (match.key === 'description') highlights.description = highlighted;
        if (match.key === 'category') highlights.category = highlighted;
      }
    });

    return highlights;
  }

  private applyHighlights(text: string, indices: readonly [number, number][]): string {
    let result = '';
    let lastIndex = 0;

    // Fuse.js indices are inclusive ranges: [start, end]
    indices.forEach(([start, end]) => {
      result += text.substring(lastIndex, start);
      result += `<mark class="bg-emerald-500/20 text-emerald-400 p-0.5 rounded">${text.substring(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });

    result += text.substring(lastIndex);
    return result;
  }

  private highlightMatch(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-emerald-500/20 text-emerald-400 p-0.5 rounded">$1</mark>');
  }

  getSuggestions(prefix: string, limit: number = 5): string[] {
    const node = this.findTrieNode(this.normalize(prefix));
    if (!node) return [];

    const suggestions: Array<{text: string, score: number}> = [];
    
    const collectWords = (node: TrieNode, current: string) => {
      if (node.isEndOfWord) {
        suggestions.push({ text: current, score: node.frequency });
      }
      for (const [char, child] of node.children) {
        collectWords(child, current + char);
      }
    };

    collectWords(node, prefix);
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.text);
  }
}
