
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  baseIndividualCustomerDataSchema, 
  customerTypes, 
  sewerageConnections,
} from "@/app/admin/data-entry/customer-data-entry-types";
import type { IndividualCustomer } from "./individual-customer-types"; 
import { individualCustomerStatuses, paymentStatuses } from "./individual-customer-types"; 
import { getBulkMeters, subscribeToBulkMeters } from "@/lib/data-store"; 
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";


const individualCustomerFormObjectSchema = baseIndividualCustomerDataSchema.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  paymentStatus: z.enum(paymentStatuses, { errorMap: () => ({ message: "Please select a valid payment status."}) }),
});

const individualCustomerFormSchema = individualCustomerFormObjectSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});


export type IndividualCustomerFormValues = z.infer<typeof individualCustomerFormSchema>; // Export the type

interface IndividualCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IndividualCustomerFormValues) => void;
  defaultValues?: IndividualCustomer | null;
  bulkMeters?: { id: string; name: string }[];
}

export function IndividualCustomerFormDialog({ open, onOpenChange, onSubmit, defaultValues, bulkMeters: propBulkMeters }: IndividualCustomerFormDialogProps) {
  const [dynamicBulkMeters, setDynamicBulkMeters] = React.useState<{ id: string; name: string }[]>(propBulkMeters || []);
  
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
        paymentStatus: "Unpaid",
    },
  });

  React.useEffect(() => {
    if (!propBulkMeters || propBulkMeters.length === 0) {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setDynamicBulkMeters(fetchedBms);
        if (fetchedBms.length === 0 && open) { 
            console.warn("IndividualCustomerFormDialog: No bulk meters available on mount.");
        }
    } else {
         setDynamicBulkMeters(propBulkMeters); 
    }

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      setDynamicBulkMeters(updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
    });
    return () => unsubscribe();
  }, [propBulkMeters, open]); 

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...defaultValues,
        ordinal: defaultValues.ordinal ?? undefined,
        meterSize: defaultValues.meterSize ?? undefined,
        previousReading: defaultValues.previousReading ?? undefined,
        currentReading: defaultValues.currentReading ?? undefined,
        assignedBulkMeterId: defaultValues.assignedBulkMeterId, 
        paymentStatus: defaultValues.paymentStatus ?? "Unpaid",
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
        paymentStatus: "Unpaid",
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
                name="assignedBulkMeterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Bulk Meter *</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined} 
                        defaultValue={field.value || undefined}
                        disabled={!!defaultValues} // Cannot change bulk meter assignment when editing for now
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dynamicBulkMeters.map((bm) => (
                          <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                        ))}
                        {dynamicBulkMeters.length === 0 && <SelectItem value="no-bms-available" disabled>No bulk meters available</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Input {...field} />
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
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseInt(val, 10));
                        }}
                      />
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
                      <Input 
                        type="number" 
                        step="0.1" 
                        {...field} 
                        value={field.value ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseFloat(val));
                        }}
                      />
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
                      <Input {...field} />
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
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        value={field.value ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseFloat(val));
                        }}
                      />
                    </FormControl>
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
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        value={field.value ?? ""} 
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseFloat(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Initial Reading Month *</FormLabel>
                     <DatePicker
                        date={field.value ? parse(field.value, "yyyy-MM", new Date()) : undefined}
                        setDate={(selectedDate) => {
                          field.onChange(selectedDate ? format(selectedDate, "yyyy-MM") : "");
                        }}
                      />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Payment Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {defaultValues ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

