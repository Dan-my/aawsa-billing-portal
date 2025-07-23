
'use server';
/**
 * @fileOverview An AI flow to read a water meter reading from an image.
 *
 * - readMeterFromImage - A function that handles the meter reading process.
 * - ReadMeterInput - The input type for the readMeterFromImage function.
 * - ReadMeterOutput - The return type for the readMeterFromImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReadMeterInputSchema = z.object({
  photoUrl: z
    .string()
    .url()
    .describe("A publicly accessible URL of a water meter photo."),
});
export type ReadMeterInput = z.infer<typeof ReadMeterInputSchema>;

const ReadMeterOutputSchema = z.object({
  reading: z.number().describe('The numerical value read from the water meter.'),
});
export type ReadMeterOutput = z.infer<typeof ReadMeterOutputSchema>;

export async function readMeterFromImage(input: ReadMeterInput): Promise<ReadMeterOutput> {
  return readMeterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readMeterPrompt',
  input: { schema: ReadMeterInputSchema },
  output: { schema: ReadMeterOutputSchema },
  prompt: `You are an expert utility meter reader. Your task is to analyze the provided image of a water meter and extract the primary numerical reading. Ignore any other numbers on the meter like serial numbers or dials that are not part of the main display. Return only the numerical value.

Analyze this image:
{{media url=photoUrl}}`,
});

const readMeterFlow = ai.defineFlow(
  {
    name: 'readMeterFlow',
    inputSchema: ReadMeterInputSchema,
    outputSchema: ReadMeterOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error('The AI model could not read a value from the image. Please try again with a clearer picture.');
    }
    return output;
  }
);
