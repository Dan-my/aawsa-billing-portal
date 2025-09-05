'use server';

/**
 * @fileOverview A customer support chatbot that answers questions based on project documentation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import {
  ChatbotRequestSchema,
  ChatbotResponseSchema,
  type ChatbotRequest,
  type ChatbotResponse
} from './chatbot-flow-types';


// This function reads the documentation files from the project root.
// It's designed to be robust against path changes during build/deployment.
const getDocumentationContext = async (): Promise<string> => {
    try {
        const docPath = path.join(process.cwd(), 'DOCUMENTATION.md');
        const readmePath = path.join(process.cwd(), 'README.md');
        
        const docContent = await fs.readFile(docPath, 'utf-8');
        const readmeContent = await fs.readFile(readmePath, 'utf-8');
        
        return `
        --- DOCUMENTATION.md ---
        ${docContent}

        --- README.md ---
        ${readmeContent}
        `;
    } catch (error) {
        console.error("Error reading documentation files for chatbot:", error);
        // Return a fallback message if files can't be read.
        return "Documentation context is currently unavailable.";
    }
};


const documentationChatbot = ai.definePrompt({
    name: 'documentationChatbot',
    input: { schema: z.object({ query: z.string(), context: z.string() }) },
    output: { schema: ChatbotResponseSchema },
    system: `You are a helpful assistant for the AAWSA Billing Portal application. Your role is to answer user questions based ONLY on the provided documentation context.

    - Be concise and clear in your answers.
    - If the answer is not in the documentation, say "I'm sorry, I don't have information about that."
    - Do not make up answers or provide information not found in the context.
    - Format your answers with markdown for readability (e.g., use bullet points for lists).
    - The user is a staff member, so address them professionally.`,
    prompt: `Context:
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
