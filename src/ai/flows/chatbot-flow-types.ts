import { z } from 'zod';

// Define the input and output schemas for the chatbot flow.
export const ChatbotRequestSchema = z.object({
  query: z.string().describe("The user's question for the chatbot."),
});
export type ChatbotRequest = z.infer<typeof ChatbotRequestSchema>;

export const ChatbotResponseSchema = z.object({
  answer: z.string().describe("The chatbot's answer to the user's question."),
});
export type ChatbotResponse = z.infer<typeof ChatbotResponseSchema>;
