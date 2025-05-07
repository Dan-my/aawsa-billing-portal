
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  individualCustomerDataEntrySchema, 
  customerTypes, 
  sewerageConnections, 
  mockBulkMeters, // Using mock data for bulk meter list
  type MockBulkMeter
} from "@/app/admin/data-entry/customer-data-entry-types";
import type { IndividualCustomer } from "./individual-customer-types";
import { individualCustomerStatuses } from "./individual-customer-types";

// Extend the base schema from data entry to include status for management purposes
const individualCustomerFormSchema = individualCustomerDataEntrySchema.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
});

type IndividualCustomerFormValues = z.infer<typeof individualCustomerFormSchema>;

interface IndividualCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IndividualCustomerFormValues) => void;
  defaultValues?: IndividualCustomer | null;
  // Potentially pass actual bulk meters list if dynamic selection is needed later
  // bulkMeters?: { id: string; name: string }[]; 
}

export function IndividualCustomerFormDialog({ open, onOpenChange, onSubmit, defaultValues }: IndividualCustomerFormDialogProps) {
  const form = useForm<IndividualCustomerFormValues>({
    resolver: zodResolver(individualCustomerFormSchema),
    defaultValues: {
      name: "",
      customerKeyNumber: "",
      contractNumber: "",
      customerType: undefined,
      bookNumber: "",
      ordinal: undefined,
      meterSize: undefined,
      meterNumber: "",
      previousReading: undefined,
      currentReading: undefined,
      month: "",
      specificArea: "",
      location: "",
      ward: "",
      sewerageConnection: undefined,
      assignedBulkMeterId: undefined,
      status: undefined,
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...defaultValues,
        // Ensure numeric fields are correctly set or reset if undefined/null
        ordinal: defaultValues.ordinal ?? undefined,
        meterSize: defaultValues.meterSize ?? undefined,
        previousReading: defaultValues.previousReading ?? undefined,
        currentReading: defaultValues.currentReading ?? undefined,
        assignedBulkMeterId: defaultValues.assignedBulkMeterId || undefined, // Ensure 'none' or actual ID
      });
    } else {
      form.reset({
        name: "",
        customerKeyNumber: "",
        contractNumber: "",
        customerType: undefined,
        bookNumber: "",
        ordinal: undefined,
        meterSize: undefined,
        meterNumber: "",
        previousReading: undefined,
        currentReading: undefined,
        month: "",
        specificArea: "",
        location: "",
        ward: "",
        sewerageConnection: undefined,
        assignedBulkMeterId: undefined,
        status: undefined,
      });
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (data: IndividualCustomerFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of the customer." : "Fill in the details to add a new customer."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerKeyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Key Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CUST12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CONTR67890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customerTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BK001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ordinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordinal *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meterSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter Size (inch) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 0.5" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meterNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MTR123XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Previous Reading *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 100.00" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
                    </FormControl>
                    <FormDescription>For new customers, this is the starting reading (often 0).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Current Reading *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 100.50" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
                    </FormControl>
                     <FormDescription>The reading at the time of registration or first use.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Reading Month (YYYY-MM) *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2023-12" {...field} />
                    </FormControl>
                     <FormDescription>Month of the initial readings above.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specificArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Area *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kebele 05, House No 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Sub-City *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bole Sub-City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward / Woreda *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Woreda 03" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sewerageConnection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sewerage Connection *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sewerage connection status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sewerageConnections.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="assignedBulkMeterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Bulk Meter (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bulk meter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Standalone)</SelectItem>
                        {mockBulkMeters.map((bm: MockBulkMeter) => (
                          <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>If this customer's meter is sub-metered under a bulk meter.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {individualCustomerStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {defaultValues ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
