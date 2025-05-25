import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";

// Extended joke database with metadata for better RAG
const JOKES_DATABASE = [
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
    },
    {
        content: "Чому комп'ютери ніколи не хворіють? Тому що у них є антивірус! 🦠",
        metadata: {
            category: "programming",
            difficulty: "easy",
            tags: ["computers", "antivirus", "health"],
            language: "ukrainian"
        }
    },
    {
        content: "Як називається програміст, який не п'є каву? Неробочий! ☕",
        metadata: {
            category: "programming",
            difficulty: "easy",
            tags: ["coffee", "programmer", "work"],
            language: "ukrainian"
        }
    },
    {
        content: "Чому JavaScript розлучився з HTML? Тому що вони не могли знайти спільний DOM! 🌐",
        metadata: {
            category: "web-development",
            difficulty: "hard",
            tags: ["javascript", "html", "dom", "relationships"],
            language: "ukrainian"
        }
    },
    {
        content: "Що робить програміст, коли не може заснути? Рахує овець в циклі while! 🐑",
        metadata: {
            category: "programming",
            difficulty: "medium",
            tags: ["sleep", "loops", "while", "sheep"],
            language: "ukrainian"
        }
    },
    {
        content: "Чому програмісти плутають Різдво з Хеловіном? Тому що Oct 31 = Dec 25! 🎃🎄",
        metadata: {
            category: "programming",
            difficulty: "hard",
            tags: ["octal", "decimal", "holidays", "math"],
            language: "ukrainian"
        }
    },
    // Additional jokes for better RAG demonstration
    {
        content: "Скільки програмістів потрібно, щоб замінити лампочку? Жодного, це апаратна проблема!",
        metadata: {
            category: "programming",
            difficulty: "medium",
            tags: ["hardware", "software", "lightbulb"],
            language: "ukrainian"
        }
    },
    {
        content: "Чому програмісти завжди плутають Різдво з Хеловіном? Тому що Oct 31 == Dec 25!",
        metadata: {
            category: "programming",
            difficulty: "hard",
            tags: ["octal", "decimal", "comparison"],
            language: "ukrainian"
        }
    },
    {
        content: "Що таке рекурсія? Щоб зрозуміти рекурсію, спочатку треба зрозуміти рекурсію.",
        metadata: {
            category: "programming",
            difficulty: "medium",
            tags: ["recursion", "definition", "loop"],
            language: "ukrainian"
        }
    }
];

export class JokesVectorStore {
    private vectorStore: FaissStore | null = null;
    private embeddings: OpenAIEmbeddings;

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

        // Convert jokes to documents
        const documents = JOKES_DATABASE.map(joke => new Document({
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
        } = {}
    ): Promise<Document[]> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized. Call initialize() first.");
        }

        const { k = 3, filter, scoreThreshold = 0.7 } = options;

        console.log(`🔍 Searching for jokes related to: "${query}"`);

        // Perform similarity search
        const results = await this.vectorStore.similaritySearchWithScore(
            query,
            k,
            filter
        );

        // Filter by score threshold
        const filteredResults = results
            .filter(([_, score]) => score >= scoreThreshold)
            .map(([doc, score]) => {
                console.log(`📊 Found joke (score: ${score.toFixed(3)}): ${doc.pageContent.substring(0, 50)}...`);
                return doc;
            });

        return filteredResults;
    }

    /**
     * Search jokes by category
     */
    async searchByCategory(category: string, k: number = 2): Promise<Document[]> {
        return this.searchJokes("", {
            k,
            filter: { category }
        });
    }

    /**
     * Search jokes by difficulty
     */
    async searchByDifficulty(difficulty: "easy" | "medium" | "hard", k: number = 2): Promise<Document[]> {
        return this.searchJokes("", {
            k,
            filter: { difficulty }
        });
    }

    /**
     * Get random jokes (fallback when no good matches)
     */
    async getRandomJokes(k: number = 2): Promise<Document[]> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized");
        }

        // Get all documents and shuffle
        const allDocs = JOKES_DATABASE.map(joke => new Document({
            pageContent: joke.content,
            metadata: joke.metadata
        }));

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
} 