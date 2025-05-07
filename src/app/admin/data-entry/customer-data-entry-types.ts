
import * as z from "zod";

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

// Base Schema for Individual Customer Data (without refinement)
export const baseIndividualCustomerDataSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  customerKeyNumber: z.string().min(1, { message: "Customer Key Number is required." }),
  contractNumber: z.string().min(1, { message: "Contract Number is required." }),
  customerType: z.enum(customerTypes, { errorMap: () => ({ message: "Please select a valid customer type." }) }),
  bookNumber: z.string().min(1, { message: "Book Number is required." }),
  ordinal: z.coerce.number().int().min(1, { message: "Ordinal must be a positive integer." }),
  meterSize: z.coerce.number().positive({ message: "Meter Size must be a positive number." }),
  meterNumber: z.string().min(1, { message: "Meter Number is required." }),
  previousReading: z.coerce.number().min(0, { message: "Previous Reading cannot be negative." }),
  currentReading: z.coerce.number().min(0, { message: "Current Reading cannot be negative." }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format." }), // e.g., 2023-12
  specificArea: z.string().min(1, { message: "Specific Area is required." }),
  location: z.string().min(1, { message: "Location / Sub-City is required." }),
  ward: z.string().min(1, { message: "Ward / Woreda is required." }),
  sewerageConnection: z.enum(sewerageConnections, { errorMap: () => ({ message: "Please select Sewerage Connection status." }) }),
  assignedBulkMeterId: z.string().optional().describe("The ID of the bulk meter this individual customer is assigned to."),
});

// Schema for Individual Customer Data Entry (with refinement)
export const individualCustomerDataEntrySchema = baseIndividualCustomerDataSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type IndividualCustomerDataEntryFormValues = z.infer<typeof individualCustomerDataEntrySchema>;


// Base Schema for Bulk Meter Data (without refinement)
export const baseBulkMeterDataSchema = z.object({
  name: z.string().min(2, { message: "Bulk meter name must be at least 2 characters." }),
  customerKeyNumber: z.string().min(1, { message: "Customer Key Number is required." }),
  contractNumber: z.string().min(1, { message: "Contract Number is required." }),
  meterSize: z.coerce.number().positive({ message: "Meter Size must be a positive number." }),
  meterNumber: z.string().min(1, { message: "Meter Number is required." }),
  previousReading: z.coerce.number().min(0, { message: "Previous Reading cannot be negative." }),
  currentReading: z.coerce.number().min(0, { message: "Current Reading cannot be negative." }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format." }),
  specificArea: z.string().min(1, { message: "Specific Area is required." }),
  location: z.string().min(1, { message: "Location / Sub-City is required." }),
  ward: z.string().min(1, { message: "Ward / Woreda is required." }),
  // Bulk meters do not typically have customerType or sewerageConnection in the same way individuals do.
  // These are attributes of the individual connections supplied by the bulk meter.
});

// Schema for Bulk Meter Data Entry (with refinement)
export const bulkMeterDataEntrySchema = baseBulkMeterDataSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type BulkMeterDataEntryFormValues = z.infer<typeof bulkMeterDataEntrySchema>;

// The static list `mockBulkMeters` has been removed as dynamic data from the store is now used.
// The type definition is kept as it might be used by props or other type definitions.
export type MockBulkMeter = { id: string; name: string };
