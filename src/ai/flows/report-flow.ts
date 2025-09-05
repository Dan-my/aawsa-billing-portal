
'use server';

/**
 * @fileOverview A report generation AI agent.
 * This flow uses Genkit tools to understand natural language queries
 * about application data (customers, bills, etc.) and returns structured
 * data for display and download.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  getCustomers,
  getBulkMeters,
  getBills,
  getBranches,
  initializeBills,
  initializeBranches,
  initializeBulkMeters,
  initializeCustomers,
} from '@/lib/data-store';
import type { IndividualCustomer, BulkMeter, Branch, DomainBill } from '@/lib/data-store';

// Helper to ensure all data is loaded before tools use it
const ensureDataInitialized = async () => {
  await Promise.all([
    initializeBranches(),
    initializeCustomers(),
    initializeBulkMeters(),
    initializeBills(),
  ]);
};

// Define tool schemas
const BillFilterSchema = z.object({
    branchName: z.string().optional().describe("The name of a specific branch to filter by, e.g., 'Kality'."),
    paymentStatus: z.enum(['Paid', 'Unpaid']).optional().describe("The payment status of the bills to retrieve."),
    timePeriod: z.enum(['last month', 'this month', 'last week', 'this week', 'all time']).optional().describe("A relative time period to filter bills. Default is 'all time'.")
});

const CustomerFilterSchema = z.object({
    branchName: z.string().optional().describe("The name of a specific branch to filter by, e.g., 'Bole'.")
});

// Tool to get bills
const getBillsTool = ai.defineTool(
  {
    name: 'getBills',
    description: 'Retrieves a list of bills, optionally filtered by branch, payment status, and time period.',
    inputSchema: BillFilterSchema,
    outputSchema: z.array(z.any()),
  },
  async (filters) => {
    await ensureDataInitialized();
    const allBills = getBills();
    const allCustomers = getCustomers();
    const allMeters = getBulkMeters();
    const allBranches = getBranches();

    let filteredBills = allBills;

    if (filters.branchName) {
        const branch = allBranches.find(b => b.name.toLowerCase().includes(filters.branchName!.toLowerCase()));
        if (branch) {
            const branchMeterIds = new Set(allMeters.filter(m => m.branchId === branch.id).map(m => m.customerKeyNumber));
            const branchCustomerIds = new Set(allCustomers.filter(c => c.branchId === branch.id).map(c => c.customerKeyNumber));
            
            filteredBills = filteredBills.filter(bill => {
                const customer = bill.individualCustomerId ? allCustomers.find(c => c.customerKeyNumber === bill.individualCustomerId) : null;
                const meter = bill.bulkMeterId ? allMeters.find(m => m.customerKeyNumber === bill.bulkMeterId) : null;
                
                return (customer && branchCustomerIds.has(customer.customerKeyNumber)) || 
                       (meter && branchMeterIds.has(meter.customerKeyNumber)) ||
                       (customer?.assignedBulkMeterId && branchMeterIds.has(customer.assignedBulkMeterId));
            });
        }
    }

    if (filters.paymentStatus) {
        filteredBills = filteredBills.filter(b => b.paymentStatus === filters.paymentStatus);
    }
    
    // Note: Time period filtering would require more complex date logic.
    // This is a simplified example.

    return filteredBills;
  }
);


// Tool to get customers
const getCustomersTool = ai.defineTool(
    {
      name: 'getCustomers',
      description: 'Retrieves a list of individual customers, optionally filtered by branch.',
      inputSchema: CustomerFilterSchema,
      outputSchema: z.array(z.any()),
    },
    async (filters) => {
        await ensureDataInitialized();
        const allCustomers = getCustomers();
        const allBranches = getBranches();
        if (filters.branchName) {
            const branch = allBranches.find(b => b.name.toLowerCase().includes(filters.branchName!.toLowerCase()));
            if(branch) {
                return allCustomers.filter(c => c.branchId === branch.id);
            }
        }
        return allCustomers;
    }
);


// Main Flow Schema
export const ReportRequestSchema = z.object({
  query: z.string(),
});
export type ReportRequest = z.infer<typeof ReportRequestSchema>;

export const ReportResponseSchema = z.object({
  summary: z.string().describe("A brief, natural language summary of the report that was generated."),
  data: z.array(z.any()).describe("The structured data array of the report results."),
  headers: z.array(z.string()).describe("An array of suggested header strings for displaying the data in a table."),
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;


const reportGeneratorAgent = ai.definePrompt({
    name: 'reportGeneratorAgent',
    input: { schema: z.object({ query: z.string() }) },
    output: { schema: ReportResponseSchema },
    system: `You are an expert data analyst for the AAWSA Billing Portal. Your task is to understand user requests for reports, use the provided tools to fetch the data, and then format the response.

    - Analyze the user's query to determine which tool to use and what parameters to pass.
    - If a user asks for "unpaid bills", use the paymentStatus "Unpaid". If they ask for "paid bills", use "Paid".
    - If a user asks for customers or bills "in a branch" or "from a branch", use the branchName filter.
    - After getting the data from a tool, create a brief, friendly summary of what you found. For example, "I found 5 unpaid bills for the Kality branch."
    - You MUST determine the most appropriate headers for the data you are returning. The headers should be human-readable (e.g., "Customer Name" instead of "customerKeyNumber").
    - ALWAYS return the data in the 'data' field, the summary in the 'summary' field, and the headers in the 'headers' field.
    - If the tool returns no data, provide a summary saying so and return an empty array for data and headers.
    `,
    tools: [getBillsTool, getCustomersTool],
});


const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: ReportRequestSchema,
    outputSchema: ReportResponseSchema,
  },
  async ({ query }) => {
    const { output } = await reportGeneratorAgent({ query });
    if (!output) {
      throw new Error('The model did not return a valid report structure.');
    }
    return output;
  }
);


export async function generateReport(input: ReportRequest): Promise<ReportResponse> {
  return generateReportFlow(input);
}
