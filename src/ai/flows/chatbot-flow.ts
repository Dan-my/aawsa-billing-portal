
'use server';

/**
 * @fileOverview A customer support chatbot that answers questions based on a dynamic knowledge base.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getKnowledgeBaseArticles, initializeKnowledgeBaseArticles } from '@/lib/data-store';
import {
  ChatbotRequestSchema,
  ChatbotResponseSchema,
  type ChatbotRequest,
  type ChatbotResponse
} from './chatbot-flow-types';

// This function retrieves knowledge base articles from the data store.
const getKnowledgeBaseContext = async (): Promise<string> => {
    try {
        await initializeKnowledgeBaseArticles();
        const articles = getKnowledgeBaseArticles();
        
        if (articles.length === 0) {
            return "No knowledge base articles found.";
        }
        
        // Format the articles into a string for the LLM context.
        return articles.map(article => `
          --- Article ---
          Title: ${article.title}
          Category: ${article.category || 'General'}
          Content: ${article.content}
          Keywords: ${(article.keywords || []).join(', ')}
        `).join('\n\n');

    } catch (error) {
        console.error("Error reading knowledge base for chatbot:", error);
        // Return a fallback message if data can't be read.
        return "Knowledge base is currently unavailable.";
    }
};

const documentationChatbot = ai.definePrompt({
    name: 'documentationChatbot',
    input: { schema: z.object({ query: z.string(), context: z.string() }) },
    output: { schema: ChatbotResponseSchema },
    system: `You are a helpful assistant for the AAWSA Billing Portal application. Your role is to answer user questions based ONLY on the provided knowledge base context.

    - Be concise and clear in your answers.
    - If the answer is not in the knowledge base, say "I'm sorry, I don't have information about that in my knowledge base."
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
    const context = await getKnowledgeBaseContext();
    
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
