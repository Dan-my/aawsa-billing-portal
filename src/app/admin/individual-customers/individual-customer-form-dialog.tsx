
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

// Zod schema refinement to ensure currentReading is not less than previousReading
// Coerce to number before comparison, handle potential nulls gracefully
const individualCustomerFormSchema = individualCustomerFormObjectSchema.refine(data => {
  const prev = data.previousReading === null || data.previousReading === undefined ? -Infinity : Number(data.previousReading);
  const curr = data.currentReading === null || data.currentReading === undefined ? -Infinity : Number(data.currentReading);
  if (isNaN(prev) || isNaN(curr)) return true; // Let Zod handle individual field type validation
  return curr >= prev;
} , {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});


export type IndividualCustomerFormValues = z.infer<typeof individualCustomerFormSchema>; 

interface IndividualCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IndividualCustomerFormValues) => void;
  defaultValues?: IndividualCustomer | null;
  bulkMeters?: { id: string; name: string }[]; 
}

export function IndividualCustomerFormDialog({ open, onOpenChange, onSubmit, defaultValues, bulkMeters: propBulkMeters }: IndividualCustomerFormDialogProps) {
  const [dynamicBulkMeters, setDynamicBulkMeters] = React.useState<{ id: string; name: string }[]>(propBulkMeters || []);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(!!defaultValues?.assignedBulkMeterId);
  
  const form = useForm<IndividualCustomerFormValues>({
    resolver: zodResolver(individualCustomerFormSchema),
    defaultValues: {
      name: "",
      customerKeyNumber: "",
      contractNumber: "",
      customerType: undefined, // Keep undefined for selects if placeholder is desired
      bookNumber: "",
      ordinal: null, // Use null for nullable numeric fields
      meterSize: null, // Use null
      meterNumber: "",
      previousReading: null, // Use null
      currentReading: null,  // Use null
      month: "",
      specificArea: "",
      location: "",
      ward: "",
      sewerageConnection: undefined, // Keep undefined for selects
      assignedBulkMeterId: undefined, // Keep undefined for selects
      status: "Active", 
      paymentStatus: "Unpaid",
    },
  });

  React.useEffect(() => {
    if (!propBulkMeters || propBulkMeters.length === 0) {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setDynamicBulkMeters(fetchedBms);
        if (fetchedBms.length === 0 && open) { 
            console.warn("IndividualCustomerFormDialog: No bulk meters available on mount for selection.");
        }
    } else {
         setDynamicBulkMeters(propBulkMeters); 
    }

    let unsubscribe = () => {};
    if (!propBulkMeters || propBulkMeters.length === 0) {
      unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
        setDynamicBulkMeters(updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
      });
    }
    return () => unsubscribe();
  }, [propBulkMeters, open]); 

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        customerKeyNumber: defaultValues.customerKeyNumber || "",
        contractNumber: defaultValues.contractNumber || "",
        customerType: defaultValues.customerType,
        bookNumber: defaultValues.bookNumber || "",
        ordinal: defaultValues.ordinal ?? null,
        meterSize: defaultValues.meterSize ?? null,
        meterNumber: defaultValues.meterNumber || "",
        previousReading: defaultValues.previousReading ?? null,
        currentReading: defaultValues.currentReading ?? null,
        month: defaultValues.month || "",
        specificArea: defaultValues.specificArea || "",
        location: defaultValues.location || "",
        ward: defaultValues.ward || "",
        sewerageConnection: defaultValues.sewerageConnection,
        assignedBulkMeterId: defaultValues.assignedBulkMeterId, 
        status: defaultValues.status || "Active",
        paymentStatus: defaultValues.paymentStatus || "Unpaid",
      });
      setIsBulkMeterSelected(!!defaultValues.assignedBulkMeterId);
    } else {
      form.reset({
        name: "",
        customerKeyNumber: "",
        contractNumber: "",
        customerType: undefined,
        bookNumber: "",
        ordinal: null,
        meterSize: null,
        meterNumber: "",
        previousReading: null,
        currentReading: null,
        month: "",
        specificArea: "",
        location: "",
        ward: "",
        sewerageConnection: undefined,
        assignedBulkMeterId: undefined, 
        status: "Active",
        paymentStatus: "Unpaid",
      });
      setIsBulkMeterSelected(false);
    }
  }, [defaultValues, form, open]);

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "assignedBulkMeterId") {
        setIsBulkMeterSelected(!!value.assignedBulkMeterId && dynamicBulkMeters.length > 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, dynamicBulkMeters]);

  const handleSubmit = (data: IndividualCustomerFormValues) => {
    onSubmit(data); 
    onOpenChange(false);
  };

  const commonFormFieldProps = {
    disabled: !isBulkMeterSelected && !defaultValues, 
  };
  const commonSelectTriggerProps = {
    disabled: !isBulkMeterSelected && !defaultValues,
  };
  const commonDatePickerProps = {
    disabledTrigger: !isBulkMeterSelected && !defaultValues,
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          setIsBulkMeterSelected(!!value && dynamicBulkMeters.length > 0);
                        }} 
                        value={field.value || ""} 
                        defaultValue={field.value || ""}
                        disabled={!!defaultValues && !!propBulkMeters && propBulkMeters.length === 1 && propBulkMeters[0].id === defaultValues.assignedBulkMeterId} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bulk meter first" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dynamicBulkMeters.length === 0 && <SelectItem value="no-bms-available" disabled>No bulk meters available</SelectItem>}
                        {dynamicBulkMeters.map((bm) => (
                          <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                        ))}
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""} />
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""} {...commonSelectTriggerProps}>
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                        value={field.value === null || field.value === undefined ? "" : String(field.value)}
                        onChange={e => {
                          const valStr = e.target.value;
                          if (valStr === "") {
                            field.onChange(null); 
                          } else {
                            const parsed = parseInt(valStr, 10);
                            field.onChange(isNaN(parsed) ? null : parsed); 
                          }
                        }}
                         {...commonFormFieldProps}
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
                        value={field.value === null || field.value === undefined ? "" : String(field.value)}
                        onChange={e => {
                          const valStr = e.target.value;
                           if (valStr === "") {
                            field.onChange(null);
                          } else {
                            const parsed = parseFloat(valStr);
                            field.onChange(isNaN(parsed) ? null : parsed);
                          }
                        }}
                         {...commonFormFieldProps}
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                        value={field.value === null || field.value === undefined ? "" : String(field.value)}
                        onChange={e => {
                          const valStr = e.target.value;
                           if (valStr === "") {
                            field.onChange(null);
                          } else {
                            const parsed = parseFloat(valStr);
                            field.onChange(isNaN(parsed) ? null : parsed);
                          }
                        }}
                         {...commonFormFieldProps}
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
                        value={field.value === null || field.value === undefined ? "" : String(field.value)}
                        onChange={e => {
                          const valStr = e.target.value;
                           if (valStr === "") {
                            field.onChange(null);
                          } else {
                            const parsed = parseFloat(valStr);
                            field.onChange(isNaN(parsed) ? null : parsed);
                          }
                        }}
                         {...commonFormFieldProps}
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
                        {...commonDatePickerProps}
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                      <Input {...field} {...commonFormFieldProps} value={field.value || ""}/>
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
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""} {...commonSelectTriggerProps}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sewerage status"/>
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
                    <Select onValueChange={field.onChange} value={field.value || "Active"} defaultValue={field.value || "Active"} {...commonSelectTriggerProps}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status"/>
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
                    <Select onValueChange={field.onChange} value={field.value || "Unpaid"} defaultValue={field.value || "Unpaid"} {...commonSelectTriggerProps}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status"/>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentStatuses.map(status => (
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
              <Button type="submit" disabled={form.formState.isSubmitting || (!isBulkMeterSelected && !defaultValues)}>
                {defaultValues ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


    