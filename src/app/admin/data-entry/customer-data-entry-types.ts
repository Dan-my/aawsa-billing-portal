
import * as z from "zod";

// These are kept for potential use in other parts of the system (e.g. Bulk Meters)
// but are no longer directly part of the simplified IndividualCustomer schema.
export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];


// Base Schema for Individual Customer Data (NEW - based on image)
export const baseIndividualCustomerDataSchemaNew = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  ordinal: z.coerce.number().int().min(1, { message: "Ordinal must be a positive integer." }),
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format." }), // e.g., 2023-12
  location: z.string().min(1, { message: "Location / Sub-City is required." }),
  ward: z.string().min(1, { message: "Ward / Woreda is required." }),
  assignedBulkMeterId: z.string({ required_error: "Assigning to a bulk meter is required." }).min(1, "Assigning to a bulk meter is required.").describe("The ID of the bulk meter this individual customer is assigned to."),
  // status will be handled by the entity type, not directly in data entry form as a user-editable field for *new* entries.
  // created_at and updated_at are handled by the database.
});

// Schema for Individual Customer Data Entry (NEW)
export const individualCustomerDataEntrySchemaNew = baseIndividualCustomerDataSchemaNew; // No specific refinements for these fields yet

export type IndividualCustomerDataEntryFormValuesNew = z.infer<typeof individualCustomerDataEntrySchemaNew>;


// Base Schema for Bulk Meter Data (remains unchanged as it's a different entity)
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
  location: z.string().min(1, { message: "Location / Sub-City is required." }),
  ward: z.string().min(1, { message: "Ward / Woreda is required." }),
});

// Schema for Bulk Meter Data Entry (with refinement)
export const bulkMeterDataEntrySchema = baseBulkMeterDataSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});

export type BulkMeterDataEntryFormValues = z.infer<typeof bulkMeterDataEntrySchema>;

export type MockBulkMeter = { id: string; name: string };

