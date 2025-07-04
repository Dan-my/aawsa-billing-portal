
import * as z from "zod";
import { customerTypes, sewerageConnections } from "@/lib/billing";

export const meterSizeOptions = [
  { value: '0.5', label: '1/2"' },
  { value: '0.75', label: '3/4"' },
  { value: '1', label: '1"' },
  { value: '1.25', label: '1 1/4"' },
  { value: '1.5', label: '1 1/2"' },
  { value: '2', label: '2"' },
  { value: '2.5', label: '2 1/2"' },
  { value: '3', label: '3"' },
  { value: '4', label: '4"' },
  { value: '5', label: '5"' },
  { value: '6', label: '6"' },
];

export const baseIndividualCustomerDataSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  customerKeyNumber: z.string().min(1, { message: "Customer Key Number is required." }),
  contractNumber: z.string().min(1, { message: "Contract Number is required." }),
  customerType: z.enum(customerTypes, { errorMap: () => ({ message: "Please select a valid customer type."}) }),
  bookNumber: z.string().min(1, { message: "Book Number is required." }),
  ordinal: z.coerce.number().int().min(1, { message: "Ordinal must be a positive integer." }),
  meterSize: z.coerce.number().positive({ message: "Meter Size must be a positive number (inch)." }),
  meterNumber: z.string().min(1, { message: "Meter Number is required." }),
  previousReading: z.coerce.number().min(0, { message: "Previous Reading cannot be negative." }),
  currentReading: z.coerce.number().min(0, { message: "Current Reading cannot be negative." }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format." }), 
  specificArea: z.string().min(1, { message: "Specific Area is required." }),
  location: z.string().min(1, { message: "Location / Sub-City is required." }), // Will be set by Branch selection
  ward: z.string().min(1, { message: "Ward / Woreda is required." }),
  sewerageConnection: z.enum(sewerageConnections, { errorMap: () => ({ message: "Please select sewerage connection status."}) }),
  assignedBulkMeterId: z.string().optional().describe("The ID of the bulk meter this individual customer is assigned to."),
  branchId: z.string().optional().describe("The ID of the branch this customer belongs to."), // New field
});

export const individualCustomerDataEntrySchema = baseIndividualCustomerDataSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});
export type IndividualCustomerDataEntryFormValues = z.infer<typeof individualCustomerDataEntrySchema>;


export const baseBulkMeterDataSchema = z.object({
  name: z.string().min(2, { message: "Bulk meter name must be at least 2 characters." }),
  customerKeyNumber: z.string().min(1, { message: "Customer Key Number is required." }),
  contractNumber: z.string().min(1, { message: "Contract Number is required." }),
  meterSize: z.coerce.number().positive({ message: "Meter Size must be a positive number (inch)." }),
  meterNumber: z.string().min(1, { message: "Meter Number is required." }),
  previousReading: z.coerce.number().min(0, { message: "Previous Reading cannot be negative." }),
  currentReading: z.coerce.number().min(0, { message: "Current Reading cannot be negative." }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format." }),
  specificArea: z.string().min(1, { message: "Specific Area is required." }),
  location: z.string().min(1, { message: "Location / Sub-City is required." }), // Will be set by Branch selection
  ward: z.string().min(1, { message: "Ward / Woreda is required." }),
  branchId: z.string().optional().describe("The ID of the branch this bulk meter belongs to."), // New field
  xCoordinate: z.coerce.number().optional(),
  yCoordinate: z.coerce.number().optional(),
});

export const bulkMeterDataEntrySchema = baseBulkMeterDataSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type BulkMeterDataEntryFormValues = z.infer<typeof bulkMeterDataEntrySchema>;

export type MockBulkMeter = { id: string; name: string };
