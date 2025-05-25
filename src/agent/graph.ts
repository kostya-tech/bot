/**
 * Joke Bot - State-based conversation flow
 * Scenario: Ask user's name → Greet personally → Ask for joke → Tell jokes → Ask for more → Repeat or end
 */
import { StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "./state.js";

// Collection of jokes for the bot to tell
const JOKES = [
  "Чому програмісти не люблять природу? Тому що там забагато багів! 🐛",
  "Що сказав один байт іншому? Нічого, вони просто обмінялися бітами! 💾",
  "Чому комп'ютери ніколи не хворіють? Тому що у них є антивірус! 🦠",
  "Як називається програміст, який не п'є каву? Неробочий! ☕",
  "Чому JavaScript розлучився з HTML? Тому що вони не могли знайти спільний DOM! 🌐",
  "Що робить програміст, коли не може заснути? Рахує овець в циклі while! 🐑",
  "Чому програмісти плутають Різдво з Хеловіном? Тому що Oct 31 = Dec 25! 🎃🎄",
];

/**
 * Main conversation handler - analyzes user input and responds based on current stage
 */
const handleConversation = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  console.log("Current state:", {
    stage: state.conversationStage || "greeting",
    jokesCount: state.jokesCount || 0,
    userName: state.userName || "невідомий",
    messagesCount: state.messages.length
  });

  const lastMessage = state.messages[state.messages.length - 1];
  const userInput = lastMessage?.content?.toString().trim() || "";
  const currentStage = state.conversationStage || "greeting";

  // Initialize default values if not set
  const userName = state.userName || "";
  const jokesCount = state.jokesCount || 0;

  switch (currentStage) {
    case "greeting":
      // Bot asks for user's name
      return {
        messages: [{
          role: "assistant",
          content: `Привіт! Я бот-жартівник. Як тебе звуть? 🤖`
        }],
        conversationStage: "waiting_for_name",
        userName,
        jokesCount
      };

    case "waiting_for_name":
      // User provides their name
      if (userInput.length > 0) {
        // Extract name (simple approach - take the input as name)
        const extractedName = userInput.replace(/мене звуть|я|моє ім'я/gi, '').trim();
        const finalName = extractedName || userInput;

        return {
          messages: [{
            role: "assistant",
            content: `Привіт, ${finalName}! Приємно познайомитися! 😊\n\nХочеш послухати жарт? 🎭`
          }],
          conversationStage: "asking_for_joke",
          userName: finalName,
          jokesCount
        };
      } else {
        return {
          messages: [{
            role: "assistant",
            content: `Скажи мені своє ім'я, будь ласка! 😊`
          }],
          conversationStage: "waiting_for_name",
          userName,
          jokesCount
        };
      }

    case "asking_for_joke":
      // Check if user wants a joke
      if (userInput.toLowerCase().includes("так") || userInput.toLowerCase().includes("yes") ||
        userInput.toLowerCase().includes("хочу") || userInput.toLowerCase().includes("давай")) {
        const joke = JOKES[jokesCount % JOKES.length];
        return {
          messages: [{
            role: "assistant",
            content: `Ось жарт для тебе, ${userName}:\n\n${joke}\n\nХочеш ще один? 😄`
          }],
          conversationStage: "asking_for_more",
          userName,
          jokesCount: jokesCount + 1
        };
      } else if (userInput.toLowerCase().includes("ні") || userInput.toLowerCase().includes("no")) {
        return {
          messages: [{
            role: "assistant",
            content: `Добре, ${userName}! Якщо передумаєш - скажи "так"! 😊`
          }],
          conversationStage: "asking_for_joke",
          userName,
          jokesCount
        };
      } else {
        return {
          messages: [{
            role: "assistant",
            content: `${userName}, скажи "так" якщо хочеш жарт, або "ні" якщо не хочеш 🤔`
          }],
          conversationStage: "asking_for_joke",
          userName,
          jokesCount
        };
      }

    case "asking_for_more":
      // Check if user wants another joke
      if (userInput.toLowerCase().includes("так") || userInput.toLowerCase().includes("yes") ||
        userInput.toLowerCase().includes("ще") || userInput.toLowerCase().includes("давай") ||
        userInput.toLowerCase().includes("хочу")) {
        const joke = JOKES[jokesCount % JOKES.length];
        return {
          messages: [{
            role: "assistant",
            content: `Ось ще один жарт для тебе, ${userName}:\n\n${joke}\n\nХочеш ще один? 😄`
          }],
          conversationStage: "asking_for_more",
          userName,
          jokesCount: jokesCount + 1
        };
      } else if (userInput.toLowerCase().includes("ні") || userInput.toLowerCase().includes("no") ||
        userInput.toLowerCase().includes("досить") || userInput.toLowerCase().includes("стоп")) {
        return {
          messages: [{
            role: "assistant",
            content: `Дякую за спілкування, ${userName}! Було весело розповідати жарти! До зустрічі! 👋😊`
          }],
          conversationStage: "conversation_ended",
          userName,
          jokesCount
        };
      } else {
        return {
          messages: [{
            role: "assistant",
            content: `${userName}, скажи "так" якщо хочеш ще один жарт, або "ні" щоб закінчити розмову 🤔`
          }],
          conversationStage: "asking_for_more",
          userName,
          jokesCount
        };
      }

    case "conversation_ended":
      // Conversation is over, but user can restart
      if (userInput.toLowerCase().includes("привіт") || userInput.toLowerCase().includes("hello") ||
        userInput.toLowerCase().includes("почати") || userInput.toLowerCase().includes("знову")) {
        return {
          messages: [{
            role: "assistant",
            content: `Привіт знову! Готовий до нових жартів? Як тебе звуть? 🤖`
          }],
          conversationStage: "waiting_for_name",
          userName: "", // Reset name for new conversation
          jokesCount: 0 // Reset jokes counter for new conversation
        };
      } else {
        return {
          messages: [{
            role: "assistant",
            content: `Розмова завершена. Скажи "привіт" щоб почати знову! 😊`
          }],
          conversationStage: "conversation_ended",
          userName,
          jokesCount
        };
      }

    default:
      // Fallback to greeting stage
      return {
        messages: [{
          role: "assistant",
          content: `Щось пішло не так... Давай почнемо спочатку! Як тебе звуть? 🤖`
        }],
        conversationStage: "waiting_for_name",
        userName: "",
        jokesCount: 0
      };
  }
};

/**
 * Routing function: Determines the next step based on conversation stage
 */
export const route = (
  _state: typeof StateAnnotation.State,
): "__end__" => {
  // Always end after processing one message
  // The demo script will handle the conversation flow
  return "__end__";
};

// Create the conversation graph
const builder = new StateGraph(StateAnnotation)
  .addNode("handleConversation", handleConversation)
  .addEdge("__start__", "handleConversation")
  .addConditionalEdges("handleConversation", route);

export const graph = builder.compile();

graph.name = "Joke Bot";
