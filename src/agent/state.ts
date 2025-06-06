import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

/**
 * A graph's StateAnnotation defines three main things:
 * 1. The structure of the data to be passed between nodes (which "channels" to read from/write to and their types)
 * 2. Default values for each field
 * 3. Reducers for the state's. Reducers are functions that determine how to apply updates to the state.
 * See [Reducers](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers) for more information.
 */

// This is the primary state of your agent, where you can store any information
export const StateAnnotation = Annotation.Root({
  /**
   * Messages track the primary execution state of the agent.
   *
   * Typically accumulates a pattern of:
   *
   * 1. HumanMessage - user input
   * 2. AIMessage with .tool_calls - agent picking tool(s) to use to collect
   *     information
   * 3. ToolMessage(s) - the responses (or errors) from the executed tools
   *
   *     (... repeat steps 2 and 3 as needed ...)
   * 4. AIMessage without .tool_calls - agent responding in unstructured
   *     format to the user.
   *
   * 5. HumanMessage - user responds with the next conversational turn.
   *
   *     (... repeat steps 2-5 as needed ... )
   *
   * Merges two lists of messages or message-like objects with role and content,
   * updating existing messages by ID.
   *
   * Message-like objects are automatically coerced by `messagesStateReducer` into
   * LangChain message classes. If a message does not have a given id,
   * LangGraph will automatically assign one.
   *
   * By default, this ensures the state is "append-only", unless the
   * new message has the same ID as an existing message.
   *
   * Returns:
   *     A new list of messages with the messages from \`right\` merged into \`left\`.
   *     If a message in \`right\` has the same ID as a message in \`left\`, the
   *     message from \`right\` will replace the message from \`left\`.`
   */
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  /**
   * Conversation stage tracking for joke bot scenario
   * Possible values:
   * - "greeting" - initial state, bot asks for user's name
   * - "waiting_for_name" - bot asked for name, waiting for user's name
   * - "asking_for_joke" - bot greeted user, asking if they want a joke
   * - "telling_jokes" - active joke telling mode
   * - "asking_for_more" - bot asked if user wants another joke
   * - "conversation_ended" - user said no, conversation finished
   */
  conversationStage: Annotation<string>,

  /**
   * User's name for personalized conversation
   */
  userName: Annotation<string>,

  /**
   * Counter for jokes told to avoid repetition
   */
  jokesCount: Annotation<number>,

  /**
   * RAG-specific fields for enhanced conversation
   */

  /**
   * Last user query for context retrieval
   */
  lastUserQuery: Annotation<string>,

  /**
   * Retrieved context from vector store
   */
  retrievedContext: Annotation<any[]>,

  /**
   * User preferences learned over time
   */
  userPreferences: Annotation<{
    preferredJokeCategory?: string;
    preferredDifficulty?: "easy" | "medium" | "hard";
    topics?: string[];
  }>,

  /**
   * Conversation history for context
   */
  conversationHistory: Annotation<string[]>,

  /**
   * Recent jokes to avoid repetition (last 5 jokes)
   */
  recentJokes: Annotation<string[]>,
});
