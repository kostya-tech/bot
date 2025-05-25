#!/usr/bin/env node

/**
 * RAG Joke Bot Demo
 * Demonstrates semantic search and LLM-generated responses
 */

import { HumanMessage } from "@langchain/core/messages";
import { createRAGGraph } from "./dist/agent/ragGraph.js";

// Mock environment for demo (in real app, use .env file)
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "demo-key";

async function runRAGDemo() {
    console.log("🚀 Starting RAG Joke Bot Demo");
    console.log("=====================================");

    try {
        // Create RAG graph
        const graph = createRAGGraph();

        // Demo conversation scenarios
        const scenarios = [
            {
                name: "🔍 Semantic Search Demo",
                messages: [
                    "Привіт!",
                    "Костя",
                    "розкажи жарт про комп'ютери", // Should find computer-related jokes
                    "так",
                    "розкажи щось про JavaScript", // Should find JS-specific jokes
                    "ні"
                ]
            },
            {
                name: "🎯 Category-based Retrieval",
                messages: [
                    "Привіт!",
                    "Марія",
                    "хочу жарт про програмування", // Should find programming jokes
                    "так",
                    "ще один складний жарт", // Should find hard difficulty jokes
                    "ні"
                ]
            },
            {
                name: "🤖 LLM Intent Analysis",
                messages: [
                    "Добрий день!",
                    "Олександр",
                    "можна жартик?", // Different way to ask for joke
                    "звичайно!",
                    "досить", // Different way to say no
                ]
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n${scenario.name}`);
            console.log("─".repeat(50));

            let state = {
                messages: [],
                conversationStage: "greeting",
                userName: "невідомий",
                jokesCount: 0,
                lastUserQuery: "",
                retrievedContext: [],
                userPreferences: {},
                conversationHistory: []
            };

            for (const userInput of scenario.messages) {
                console.log(`\n👤 User: ${userInput}`);

                // Add user message to state
                state.messages.push(new HumanMessage(userInput));

                // Process through RAG graph
                const result = await graph.invoke(state);

                // Get bot response
                const lastMessage = result.messages[result.messages.length - 1];
                console.log(`🤖 Bot: ${lastMessage.content}`);

                // Show RAG insights
                if (result.retrievedContext && result.retrievedContext.length > 0) {
                    console.log(`📊 Retrieved ${result.retrievedContext.length} relevant jokes`);
                    result.retrievedContext.forEach((joke, i) => {
                        console.log(`   ${i + 1}. Category: ${joke.metadata.category}, Difficulty: ${joke.metadata.difficulty}`);
                    });
                }

                if (result.userPreferences && result.userPreferences.preferredJokeCategory) {
                    console.log(`🎯 Learned preference: ${result.userPreferences.preferredJokeCategory}`);
                }

                // Update state for next iteration
                state = result;

                // Small delay for readability
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`\n✅ Scenario completed. Total jokes told: ${state.jokesCount}`);
        }

    } catch (error) {
        console.error("❌ Demo failed:", error.message);

        if (error.message.includes("API key")) {
            console.log("\n💡 To run with real OpenAI API:");
            console.log("1. Get API key from https://platform.openai.com/");
            console.log("2. Set environment variable: export OPENAI_API_KEY=your_key");
            console.log("3. Run: npm run demo:rag");
        }
    }

    console.log("\n🎉 RAG Demo completed!");
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runRAGDemo().catch(console.error);
}

export { runRAGDemo }; 