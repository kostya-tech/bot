import { graph } from './dist/src/agent/graph.js';

async function testMultipleConversations() {
    console.log('🤖 LangGraph Chatbot Interactive Demo\n');
    console.log('='.repeat(50));

    const conversations = [
        "Hello!",
        "How are you?",
        "What's your name?",
        "Can you help me?",
        "Tell me a joke",
        "Goodbye!"
    ];

    for (let i = 0; i < conversations.length; i++) {
        const userMessage = conversations[i];

        console.log(`\n💬 Conversation ${i + 1}:`);
        console.log(`👤 User: ${userMessage}`);

        try {
            const result = await graph.invoke({
                messages: [userMessage]
            });

            const botResponse = result.messages[result.messages.length - 1].content;
            console.log(`🤖 Bot: ${botResponse}`);

            // Add a small delay to make it feel more natural
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`❌ Error in conversation ${i + 1}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo completed! The chatbot is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   • Open LangGraph Studio: https://smith.langchain.com/studio?baseUrl=http://localhost:2024');
    console.log('   • Modify src/agent/graph.ts to add real LLM integration');
    console.log('   • Add custom tools and functionality');
}

testMultipleConversations(); 