import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current file directory for relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load jokes from external JSON file
 */
function loadJokesFromFile(): any[] {
    try {
        const jokesPath = join(__dirname, "../../data/jokes.json");
        const jokesData = readFileSync(jokesPath, "utf-8");
        const jokes = JSON.parse(jokesData);
        console.log(`📚 Loaded ${jokes.length} jokes from ${jokesPath}`);
        return jokes;
    } catch (error) {
        console.error("❌ Error loading jokes from file:", error);
        console.log("🔄 Falling back to default jokes...");

        // Fallback to default jokes if file not found
        return [
            {
                content: "Чому програмісти не люблять природу? Тому що там забагато багів! 🐛",
                metadata: {
                    category: "programming",
                    difficulty: "easy",
                    tags: ["bugs", "nature", "programming"],
                    language: "ukrainian"
                }
            },
            {
                content: "Що сказав один байт іншому? Нічого, вони просто обмінялися бітами! 💾",
                metadata: {
                    category: "programming",
                    difficulty: "medium",
                    tags: ["bytes", "bits", "communication"],
                    language: "ukrainian"
                }
            }
        ];
    }
}

export class JokesVectorStore {
    private vectorStore: FaissStore | null = null;
    private embeddings: OpenAIEmbeddings;
    private jokesDatabase: any[] = []; // Store jokes in class instance

    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-3-small", // Cost-effective embedding model
        });
    }

    /**
     * Initialize the vector store with jokes
     */
    async initialize(): Promise<void> {
        console.log("🔄 Initializing jokes vector store...");

        // Load fresh jokes from file
        this.jokesDatabase = loadJokesFromFile();

        // Convert jokes to documents
        const documents = this.jokesDatabase.map((joke: any) => new Document({
            pageContent: joke.content,
            metadata: joke.metadata
        }));

        // Create vector store from documents
        this.vectorStore = await FaissStore.fromDocuments(
            documents,
            this.embeddings
        );

        console.log(`✅ Vector store initialized with ${documents.length} jokes`);
    }

    /**
     * Search for relevant jokes based on user query
     */
    async searchJokes(
        query: string,
        options: {
            k?: number;
            filter?: Record<string, any>;
            scoreThreshold?: number;
            excludeJokes?: string[]; // Jokes to exclude from results
        } = {}
    ): Promise<Document[]> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized. Call initialize() first.");
        }

        const { k = 3, filter, scoreThreshold = 0.7, excludeJokes = [] } = options;

        console.log(`🔍 Searching for jokes related to: "${query}"`);
        if (excludeJokes.length > 0) {
            console.log(`🚫 Excluding ${excludeJokes.length} recent jokes from results`);
        }

        // Perform similarity search with more results to account for exclusions
        const searchK = Math.max(k * 2, 10); // Get more results to filter from
        const results = await this.vectorStore.similaritySearchWithScore(
            query,
            searchK,
            filter
        );

        // Filter by score threshold and exclude recent jokes
        const filteredResults = results
            .filter(([_, score]) => score >= scoreThreshold)
            .filter(([doc, _]) => {
                // Check if this joke was recently shown
                const isRecent = excludeJokes.some(recentJoke =>
                    doc.pageContent.trim() === recentJoke.trim()
                );
                return !isRecent;
            })
            .slice(0, k) // Take only the requested number after filtering
            .map(([doc, score]) => {
                console.log(`📊 Found joke (score: ${score.toFixed(3)}): ${doc.pageContent.substring(0, 50)}...`);
                return doc;
            });

        return filteredResults;
    }

    /**
     * Search jokes by category
     */
    async searchByCategory(category: string, k: number = 2, excludeJokes: string[] = []): Promise<Document[]> {
        return this.searchJokes("", {
            k,
            filter: { category },
            excludeJokes
        });
    }

    /**
     * Search jokes by difficulty
     */
    async searchByDifficulty(difficulty: "easy" | "medium" | "hard", k: number = 2, excludeJokes: string[] = []): Promise<Document[]> {
        return this.searchJokes("", {
            k,
            filter: { difficulty },
            excludeJokes
        });
    }

    /**
     * Get random jokes (fallback when no good matches)
     */
    async getRandomJokes(k: number = 2, excludeJokes: string[] = []): Promise<Document[]> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized");
        }

        console.log(`🎲 Getting ${k} random jokes`);
        if (excludeJokes.length > 0) {
            console.log(`🚫 Excluding ${excludeJokes.length} recent jokes from random selection`);
        }

        // Get all documents and filter out recent jokes
        const allDocs = this.jokesDatabase
            .filter((joke: any) => {
                const isRecent = excludeJokes.some(recentJoke =>
                    joke.content.trim() === recentJoke.trim()
                );
                return !isRecent;
            })
            .map((joke: any) => new Document({
                pageContent: joke.content,
                metadata: joke.metadata
            }));

        if (allDocs.length === 0) {
            console.log("⚠️ No jokes available after excluding recent ones, returning original jokes");
            // If all jokes are recent, return original jokes anyway
            return this.jokesDatabase
                .map((joke: any) => new Document({
                    pageContent: joke.content,
                    metadata: joke.metadata
                }))
                .sort(() => 0.5 - Math.random())
                .slice(0, k);
        }

        const shuffled = allDocs.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, k);
    }

    /**
     * Save vector store to disk
     */
    async save(directory: string): Promise<void> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized");
        }

        await this.vectorStore.save(directory);
        console.log(`💾 Vector store saved to ${directory}`);
    }

    /**
     * Load vector store from disk
     */
    async load(directory: string): Promise<void> {
        this.vectorStore = await FaissStore.load(directory, this.embeddings);
        console.log(`📂 Vector store loaded from ${directory}`);
    }

    /**
     * Reload jokes from JSON file and reinitialize vector store
     */
    async reloadJokes(): Promise<void> {
        console.log("🔄 Reloading jokes from JSON file...");

        // Reload jokes from file
        const newJokes = loadJokesFromFile();

        // Convert to documents
        const documents = newJokes.map((joke: any) => new Document({
            pageContent: joke.content,
            metadata: joke.metadata
        }));

        // Recreate vector store
        this.vectorStore = await FaissStore.fromDocuments(
            documents,
            this.embeddings
        );

        console.log(`✅ Vector store reloaded with ${documents.length} jokes`);
    }

    /**
     * Get current jokes count
     */
    getJokesCount(): number {
        return this.jokesDatabase.length;
    }
} 