import { graph } from './dist/src/agent/graph.js';

async function runJokeBotDemo() {
    console.log('🎭 Демонстрація Жарт-Бота\n');
    console.log('='.repeat(60));

    // Scenario conversation flow
    const conversation = [
        "Привіт!",        // Trigger greeting
        "Костя",          // User provides name
        "так",            // User wants a joke
        "так",            // User wants another joke
        "так",            // User wants another joke
        "ні"              // User doesn't want more jokes
    ];

    let currentState = {
        messages: [],
        conversationStage: "greeting",
        userName: "",
        jokesCount: 0
    };

    for (let i = 0; i < conversation.length; i++) {
        const userMessage = conversation[i];

        console.log(`\n🔄 Крок ${i + 1}:`);
        console.log(`👤 Користувач: "${userMessage}"`);
        console.log(`📊 Стан: ${currentState.conversationStage}, Жартів: ${currentState.jokesCount}`);

        try {
            // Add user message to state
            const inputState = {
                ...currentState,
                messages: [...currentState.messages, { role: "user", content: userMessage }]
            };

            const result = await graph.invoke(inputState, { recursionLimit: 5 });

            // Get bot response
            const botResponse = result.messages[result.messages.length - 1].content;
            console.log(`🤖 Бот: "${botResponse}"`);

            // Update state for next iteration
            currentState = {
                messages: result.messages,
                conversationStage: result.conversationStage || currentState.conversationStage,
                userName: result.userName || currentState.userName,
                jokesCount: result.jokesCount || currentState.jokesCount
            };

            // Add a small delay for readability
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error('❌ Помилка:', error.message);
            break;
        }
    }

    console.log('\n🎉 Демонстрація завершена!');
    console.log('\n📈 Статистика:');
    console.log(`   • Всього повідомлень: ${currentState.messages.length}`);
    console.log(`   • Розказано жартів: ${currentState.jokesCount}`);
    console.log(`   • Фінальний стан: ${currentState.conversationStage}`);
}

// Run the demo
runJokeBotDemo().catch(console.error); 