import { graph } from './dist/src/agent/graph.js';

async function testGraph() {
    console.log('🤖 Testing LangGraph chatbot...\n');

    const input = {
        messages: ["Hello! How are you today?"]
    };

    console.log('📝 Input:', input.messages[0]);

    try {
        const result = await graph.invoke(input);
        console.log('🎯 Output:', result.messages[result.messages.length - 1].content);
        console.log('\n✅ Graph executed successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGraph(); 