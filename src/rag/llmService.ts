import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

export class LLMService {
    private llm: ChatOpenAI;

    constructor() {
        this.llm = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4o-mini", // Cost-effective model
            temperature: 0.7, // Some creativity for jokes
        });
    }

    /**
     * Generate a personalized joke response based on retrieved context
     */
    async generateJokeResponse(
        userName: string,
        userMessage: string,
        retrievedJokes: Document[],
        conversationStage: string
    ): Promise<string> {

        // Create context from retrieved jokes
        const jokesContext = retrievedJokes.map((doc, index) =>
            `${index + 1}. ${doc.pageContent} (Category: ${doc.metadata.category}, Difficulty: ${doc.metadata.difficulty})`
        ).join('\n');

        const prompt = PromptTemplate.fromTemplate(`
Ти - дружелюбний бот-жартівник, який розмовляє українською мовою. 
Твоє завдання - персоналізовано відповісти користувачу на основі контексту.

КОНТЕКСТ ЖАРТІВ:
{jokesContext}

ІНФОРМАЦІЯ ПРО КОРИСТУВАЧА:
- Ім'я: {userName}
- Повідомлення: {userMessage}
- Етап розмови: {conversationStage}

ІНСТРУКЦІЇ:
1. Використай найбільш релевантний жарт з контексту
2. Адаптуй відповідь під ім'я користувача
3. Зроби відповідь природною та дружелюбною
4. Додай емодзі для веселощів
5. Запитай чи хоче користувач ще один жарт

ПРИКЛАД ВІДПОВІДІ:
"[жарт з контексту] 😄
Хочеш ще один?"

ВІДПОВІДЬ:
`);

        const formattedPrompt = await prompt.format({
            jokesContext: jokesContext || "Жартів не знайдено в контексті",
            userName,
            userMessage,
            conversationStage
        });

        const response = await this.llm.invoke(formattedPrompt);
        console.log("📊 [DEBUG] Raw LLM response:", response.content);
        return response.content as string;
    }

    /**
     * Generate a greeting response
     */
    async generateGreeting(userName?: string): Promise<string> {
        console.log("🎯 [DEBUG] Generating greeting for:", userName || "unknown user");

        if (userName) {
            // User name is known - personalized greeting
            const prompt = PromptTemplate.fromTemplate(`
Ти - дружелюбний бот-жартівник. Користувача звуть {userName}.

Привітайся персонально з {userName}, скажи що радий знайомству та запропонуй розповісти жарт.
Використай українську мову та емодзі.

ВІДПОВІДЬ:
`);

            const formattedPrompt = await prompt.format({ userName });
            const response = await this.llm.invoke(formattedPrompt);
            console.log("📊 [DEBUG] Personalized greeting response:", response.content);
            return response.content as string;
        } else {
            // User name is unknown - ask for name
            const prompt = PromptTemplate.fromTemplate(`
Ти - дружелюбний бот-жартівник. Ім'я користувача невідоме.

Привітайся дружелюбно та запитай як користувача звуть.
Використай українську мову та емодзі.

ВІДПОВІДЬ:
`);

            const formattedPrompt = await prompt.format({});
            const response = await this.llm.invoke(formattedPrompt);
            console.log("📊 [DEBUG] Name request response:", response.content);
            return response.content as string;
        }
    }

    /**
     * Generate a farewell response
     */
    async generateFarewell(userName: string, jokesCount: number): Promise<string> {
        const prompt = PromptTemplate.fromTemplate(`
Ти - дружелюбний бот-жартівник. Попрощайся з користувачем українською мовою.

ІНФОРМАЦІЯ:
- Ім'я користувача: {userName}
- Кількість розказаних жартів: {jokesCount}

Зроби прощання персональним, подякуй за спілкування та додай емодзі.

ВІДПОВІДЬ:
`);

        const formattedPrompt = await prompt.format({
            userName,
            jokesCount: jokesCount.toString()
        });

        const response = await this.llm.invoke(formattedPrompt); console.log("📊 [DEBUG] Raw LLM response:", response.content);
        return response.content as string;
    }

    /**
     * Analyze user intent with conversation context
     */
    async analyzeUserIntentWithContext(
        userMessage: string,
        conversationHistory: string[],
        conversationStage: string,
        userName?: string
    ): Promise<{
        intent: 'want_joke' | 'dont_want_joke' | 'greeting' | 'farewell' | 'provide_name' | 'unclear';
        confidence: number;
        extractedName?: string;
        reasoning?: string;
    }> {
        const contextString = conversationHistory.length > 0
            ? conversationHistory.slice(-5).join('\n- ') // Last 5 messages
            : "Немає попередньої історії";

        const prompt = PromptTemplate.fromTemplate(`
Проаналізуй повідомлення користувача з урахуванням контексту розмови.

ПОТОЧНЕ ПОВІДОМЛЕННЯ: "{userMessage}"

КОНТЕКСТ РОЗМОВИ:
- Етап: {conversationStage}
- Ім'я користувача: {userName}
- Історія останніх повідомлень:
{contextString}

Можливі наміри:
- want_joke: хоче жарт (так, давай, хочу, ще один)
- dont_want_joke: не хоче жарт (ні, досить, стоп)
- greeting: вітається (привіт, hello, добрий день)
- farewell: прощається (до побачення, бувай)
- provide_name: надає ім'я (мене звуть, я, моє ім'я)
- unclear: незрозуміло

ВАЖЛИВО: Відповідай ТІЛЬКИ чистим JSON без markdown блоків!

Формат відповіді:
{{
  "intent": "намір",
  "confidence": 0.95,
  "extractedName": "ім'я або null",
  "reasoning": "коротке пояснення чому такий намір"
}}
`);

        console.log("🎯 [DEBUG] Analyzing intent with context for:", userMessage);
        const formattedPrompt = await prompt.format({
            userMessage,
            contextString,
            conversationStage,
            userName: userName || "невідоме"
        });
        const response = await this.llm.invoke(formattedPrompt);
        console.log("📊 [DEBUG] Contextual analysis response:", response.content);

        try {
            let cleanResponse = response.content as string;
            cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            console.log("🧹 [DEBUG] Cleaned contextual response:", cleanResponse);
            const parsed = JSON.parse(cleanResponse);
            console.log("✅ [DEBUG] Parsed contextual intent:", parsed);
            return parsed;
        } catch (error) {
            console.error("❌ Failed to parse contextual LLM response:", error);
            console.error("📄 Raw response:", response.content);
            return {
                intent: 'unclear',
                confidence: 0.3,
                reasoning: "Помилка парсингу відповіді"
            };
        }
    }

    /**
     * Analyze user intent from their message (simple version)
     */
    async analyzeUserIntent(userMessage: string): Promise<{
        intent: 'want_joke' | 'dont_want_joke' | 'greeting' | 'farewell' | 'provide_name' | 'unclear';
        confidence: number;
        extractedName?: string;
    }> {
        const prompt = PromptTemplate.fromTemplate(`
Проаналізуй повідомлення користувача та визнач його намір.

ПОВІДОМЛЕННЯ: "{userMessage}"

Можливі наміри:
- want_joke: хоче жарт (так, давай, хочу, ще один)
- dont_want_joke: не хоче жарт (ні, досить, стоп)
- greeting: вітається (привіт, hello, добрий день)
- farewell: прощається (до побачення, бувай)
- provide_name: надає ім'я (мене звуть, я, моє ім'я)
- unclear: незрозуміло

Якщо користувач надає ім'я, витягни його.

ВАЖЛИВО: Відповідай ТІЛЬКИ чистим JSON без markdown блоків!

Формат відповіді:
{{
  "intent": "намір",
  "confidence": 0.95,
  "extractedName": "ім'я або null"
}}
`);

        console.log("🎯 [DEBUG] Analyzing intent for:", userMessage);
        const formattedPrompt = await prompt.format({ userMessage });
        const response = await this.llm.invoke(formattedPrompt);
        console.log("📊 [DEBUG] Raw LLM response:", response.content);

        try {
            // Clean the response from markdown code blocks
            let cleanResponse = response.content as string;
            cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            console.log("🧹 [DEBUG] Cleaned response:", cleanResponse);
            const parsed = JSON.parse(cleanResponse);
            console.log("✅ [DEBUG] Parsed intent:", parsed);
            return parsed;
        } catch (error) {
            console.error("❌ Failed to parse LLM response:", error);
            console.error("📄 Raw response:", response.content);
            return {
                intent: 'unclear',
                confidence: 0.5
            };
        }
    }

    /**
     * Generate a contextual response when no jokes are found
     */
    async generateNoJokesResponse(userName: string, userQuery: string): Promise<string> {
        const prompt = PromptTemplate.fromTemplate(`
Користувач {userName} запитав про жарти, але релевантних жартів не знайдено.
Запит: "{userQuery}"

Вибач перед користувачем, запропонуй загальний жарт або попроси уточнити що він хоче.
Відповідай українською мовою з емодзі.

ВІДПОВІДЬ:
`);

        const formattedPrompt = await prompt.format({ userName, userQuery });
        const response = await this.llm.invoke(formattedPrompt); console.log("📊 [DEBUG] Raw LLM response:", response.content);
        return response.content as string;
    }
} 