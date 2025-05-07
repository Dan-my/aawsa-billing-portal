
import * as z from "zod";

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const customerDataEntrySchema = z.object({
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
  location: z.string().min(1, { message: "Location is required." }),
  ward: z.string().min(1, { message: "Ward is required." }),
  sewerageConnection: z.enum(sewerageConnections, { errorMap: () => ({ message: "Please select Sewerage Connection status." }) }),
  entryType: z.enum(["bulk", "individual"], { errorMap: () => ({ message: "Please select an entry type."}) })
}).refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type CustomerDataEntryFormValues = z.infer<typeof customerDataEntrySchema>;
