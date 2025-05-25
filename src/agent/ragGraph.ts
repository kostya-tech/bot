import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { StateAnnotation } from "./state.js";
import { JokesVectorStore } from "../rag/vectorStore.js";
import { LLMService } from "../rag/llmService.js";

// Initialize RAG components
const vectorStore = new JokesVectorStore();
const llmService = new LLMService();

// Initialize vector store on startup
let isVectorStoreInitialized = false;

async function ensureVectorStoreInitialized() {
    if (!isVectorStoreInitialized) {
        await vectorStore.initialize();
        isVectorStoreInitialized = true;
    }
}

/**
 * RAG Node: Retrieve relevant jokes based on user query
 */
async function retrieveContext(state: typeof StateAnnotation.State) {
    await ensureVectorStoreInitialized();

    const lastMessage = state.messages[state.messages.length - 1];
    const userQuery = typeof lastMessage?.content === "string" ? lastMessage.content : (lastMessage?.content?.toString() || "");

    console.log(`🔍 RAG Retrieval for query: "${userQuery}"`);

    // Extract user preferences from conversation history
    const userPrefs = state.userPreferences || {};

    try {
        // Perform semantic search
        let retrievedJokes = await vectorStore.searchJokes(userQuery, {
            k: 3,
            scoreThreshold: 0.6
        });

        // If no good matches, try category-based search
        if (retrievedJokes.length === 0 && userPrefs.preferredJokeCategory) {
            console.log(`🎯 Fallback to category search: ${userPrefs.preferredJokeCategory}`);
            retrievedJokes = await vectorStore.searchByCategory(userPrefs.preferredJokeCategory, 2);
        }

        // Final fallback to random jokes
        if (retrievedJokes.length === 0) {
            console.log("🎲 Fallback to random jokes");
            retrievedJokes = await vectorStore.getRandomJokes(2);
        }

        console.log(`✅ Retrieved ${retrievedJokes.length} jokes`);

        return {
            lastUserQuery: userQuery,
            retrievedContext: retrievedJokes,
            conversationHistory: [...(state.conversationHistory || []), userQuery]
        };
    } catch (error) {
        console.error("❌ Error in retrieval:", error);
        return {
            lastUserQuery: userQuery,
            retrievedContext: [],
            conversationHistory: [...(state.conversationHistory || []), userQuery]
        };
    }
}

/**
 * RAG Node: Generate response using LLM with retrieved context
 */
async function generateResponse(state: typeof StateAnnotation.State) {
    const userName = state.userName || "друже";
    const userMessage = state.lastUserQuery || "";
    const retrievedJokes = state.retrievedContext || [];
    const conversationStage = state.conversationStage || "greeting";

    console.log(`🤖 Generating response for stage: ${conversationStage}`);

    try {
        let response: string;

        switch (conversationStage) {
            case "greeting":
                response = await llmService.generateGreeting();
                return {
                    messages: [new AIMessage(response)],
                    conversationStage: "waiting_for_name"
                };

            case "waiting_for_name":
                // Analyze user intent to extract name
                const intent = await llmService.analyzeUserIntent(userMessage);

                if (intent.extractedName) {
                    const greeting = await llmService.generateGreeting(intent.extractedName);
                    return {
                        messages: [new AIMessage(greeting)],
                        userName: intent.extractedName,
                        conversationStage: "asking_for_joke"
                    };
                } else {
                    response = "Вибач, не зрозумів твоє ім'я. Можеш повторити? 😊";
                    return {
                        messages: [new AIMessage(response)]
                    };
                }

            case "asking_for_joke":
            case "asking_for_more":
                const userIntent = await llmService.analyzeUserIntent(userMessage);

                if (userIntent.intent === "want_joke") {
                    if (retrievedJokes.length > 0) {
                        response = await llmService.generateJokeResponse(
                            userName,
                            userMessage,
                            retrievedJokes,
                            conversationStage
                        );

                        // Update user preferences based on retrieved jokes
                        const jokeCategories = retrievedJokes.map(joke => joke.metadata.category);
                        const preferredCategory = jokeCategories[0]; // Most relevant

                        return {
                            messages: [new AIMessage(response)],
                            jokesCount: (state.jokesCount || 0) + 1,
                            conversationStage: "asking_for_more",
                            userPreferences: {
                                ...state.userPreferences,
                                preferredJokeCategory: preferredCategory
                            }
                        };
                    } else {
                        response = await llmService.generateNoJokesResponse(userName, userMessage);
                        return {
                            messages: [new AIMessage(response)],
                            conversationStage: "asking_for_more"
                        };
                    }
                } else if (userIntent.intent === "dont_want_joke") {
                    response = await llmService.generateFarewell(userName, state.jokesCount || 0);
                    return {
                        messages: [new AIMessage(response)],
                        conversationStage: "conversation_ended"
                    };
                } else {
                    response = "Не зрозумів 🤔 Хочеш жарт? Відповідай 'так' або 'ні' 😊";
                    return {
                        messages: [new AIMessage(response)]
                    };
                }

            case "conversation_ended":
                response = "Розмова завершена! Якщо хочеш ще жартів, просто напиши 'привіт' 👋";
                return {
                    messages: [new AIMessage(response)],
                    conversationStage: "greeting",
                    jokesCount: 0
                };

            default:
                response = await llmService.generateGreeting();
                return {
                    messages: [new AIMessage(response)],
                    conversationStage: "waiting_for_name"
                };
        }
    } catch (error) {
        console.error("❌ Error in generation:", error);
        const fallbackResponse = "Вибач, сталася помилка 😅 Спробуй ще раз!";
        return {
            messages: [new AIMessage(fallbackResponse)]
        };
    }
}

/**
 * Router: Determine next step based on conversation stage
 */
function routeConversation(state: typeof StateAnnotation.State) {
    const stage = state.conversationStage || "greeting";

    console.log(`🧭 Routing from stage: ${stage}`);

    // Always retrieve context first, then generate
    if (stage === "conversation_ended") {
        return "generate"; // Skip retrieval for ended conversations
    }

    return "retrieve";
}

/**
 * Create the RAG-enhanced conversation graph
 */
export function createRAGGraph() {
    const workflow = new StateGraph(StateAnnotation)
        .addNode("retrieve", retrieveContext)
        .addNode("generate", generateResponse)
        .addConditionalEdges("__start__", routeConversation)
        .addEdge("retrieve", "generate")
        .addEdge("generate", END);

    return workflow.compile();
}

// Export for testing
export { vectorStore, llmService }; 