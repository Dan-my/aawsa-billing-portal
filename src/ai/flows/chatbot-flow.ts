
'use server';

/**
 * @fileOverview A customer support chatbot that answers questions based on project documentation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import {
  ChatbotRequestSchema,
  ChatbotResponseSchema,
  type ChatbotRequest,
  type ChatbotResponse
} from './chatbot-flow-types';

// This function retrieves the content of the main documentation file.
const getDocumentationContext = async (): Promise<string> => {
    try {
        // Construct the full path to the DOCUMENTATION.md file in the project root
        const docPath = path.join(process.cwd(), 'DOCUMENTATION.md');
        const fileContent = await fs.readFile(docPath, 'utf-8');
        return fileContent;
    } catch (error) {
        console.error("Error reading documentation file for chatbot:", error);
        // Return a fallback message if the documentation can't be read.
        return "The application documentation is currently unavailable.";
    }
};

const documentationChatbot = ai.definePrompt({
    name: 'documentationChatbot',
    input: { schema: z.object({ query: z.string(), context: z.string() }) },
    output: { schema: ChatbotResponseSchema },
    system: `You are a helpful assistant for the AAWSA Billing Portal application. Your role is to answer user questions based ONLY on the provided application documentation.

    - Be concise and clear in your answers.
    - If the answer is not in the documentation, say "I'm sorry, I don't have information about that in my documentation."
    - Do not make up answers or provide information not found in the context.
    - Format your answers with markdown for readability (e.g., use bullet points for lists, bold for key terms).
    - The user is a staff member, so address them professionally.`,
    prompt: `Context from DOCUMENTATION.md:
    {{{context}}}
    
    User's Question:
    "{{{query}}}"`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotRequestSchema,
    outputSchema: ChatbotResponseSchema,
  },
  async ({ query }) => {
    const context = await getDocumentationContext();
    
    const response = await documentationChatbot({
        query,
        context,
    });
    
    if (!response || !response.output) {
      console.error("Chatbot AI response is missing output for query:", query);
      return { answer: "I'm sorry, I encountered an error and cannot answer at this time." };
    }

    return response.output;
  }
);

// This is the exported function that the UI will call.
export async function askChatbot(input: ChatbotRequest): Promise<ChatbotResponse> {
  return chatbotFlow(input);
}
