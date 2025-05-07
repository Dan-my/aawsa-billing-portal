
import * as z from "zod";

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

// Schema for Individual Customer Data Entry
export const individualCustomerDataEntrySchema = z.object({
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
}).refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type IndividualCustomerDataEntryFormValues = z.infer<typeof individualCustomerDataEntrySchema>;

// Schema for Bulk Meter Data Entry
export const bulkMeterDataEntrySchema = z.object({
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
}).refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type BulkMeterDataEntryFormValues = z.infer<typeof bulkMeterDataEntrySchema>;

// Mock data for bulk meters - in a real app, this would come from a database
export const mockBulkMeters = [
  { id: "bm_kality_001", name: "Kality Industrial Zone - BM001" },
  { id: "bm_bole_residential_002", name: "Bole Residential Complex - BM002" },
  { id: "bm_megenagna_commercial_003", name: "Megenagna Commercial Area - BM003" },
];
export type MockBulkMeter = typeof mockBulkMeters[number];
