import { graph } from './dist/src/agent/graph.js';

async function quickTest() {
    console.log('🚀 Швидкий тест жарт-бота\n');

    let state = {
        messages: [],
        conversationStage: "greeting",
        userName: "",
        jokesCount: 0
    };

    // Test 1: Initial greeting
    console.log('1️⃣ Початкове вітання:');
    state.messages.push({ role: "user", content: "Привіт!" });
    let result = await graph.invoke(state);
    console.log('🤖:', result.messages[result.messages.length - 1].content);
    state = { ...result };

    // Test 2: Provide name
    console.log('\n2️⃣ Надання імені:');
    state.messages.push({ role: "user", content: "Олексій" });
    result = await graph.invoke(state);
    console.log('🤖:', result.messages[result.messages.length - 1].content);
    state = { ...result };

    // Test 3: Want a joke
    console.log('\n3️⃣ Хочу жарт:');
    state.messages.push({ role: "user", content: "так" });
    result = await graph.invoke(state);
    console.log('🤖:', result.messages[result.messages.length - 1].content);
    state = { ...result };

    // Test 4: Another joke
    console.log('\n4️⃣ Ще один жарт:');
    state.messages.push({ role: "user", content: "так" });
    result = await graph.invoke(state);
    console.log('🤖:', result.messages[result.messages.length - 1].content);
    state = { ...result };

    // Test 5: End conversation
    console.log('\n5️⃣ Завершення:');
    state.messages.push({ role: "user", content: "ні" });
    result = await graph.invoke(state);
    console.log('🤖:', result.messages[result.messages.length - 1].content);

    console.log('\n✅ Тест завершено!');
    console.log(`📊 Фінальний стан: ${result.conversationStage}, Жартів: ${result.jokesCount}`);
}

quickTest().catch(console.error); 