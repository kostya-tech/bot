import { describe, it, expect } from "@jest/globals";
import { route } from "../src/agent/graph.js";
describe("Routers", () => {
  it("Test route", async () => {
    const res = route({
      messages: [],
      conversationStage: "greeting",
      userName: "",
      jokesCount: 0
    });
    expect(res).toEqual("handleConversation");
  }, 100_000);
});
