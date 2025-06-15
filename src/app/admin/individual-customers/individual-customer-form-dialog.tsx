
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
  baseIndividualCustomerDataSchemaNew, // Use the new schema
} from "@/app/admin/data-entry/customer-data-entry-types";
import type { IndividualCustomer } from "./individual-customer-types"; // Uses updated IndividualCustomer type
import { individualCustomerStatuses } from "./individual-customer-types";
import { getBulkMeters, subscribeToBulkMeters, initializeBulkMeters } from "@/lib/data-store";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";

// Schema for the form, extending the base data entry schema with status
const individualCustomerFormObjectSchema = baseIndividualCustomerDataSchemaNew.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
});

export type IndividualCustomerFormValues = z.infer<typeof individualCustomerFormObjectSchema>;

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
    resolver: zodResolver(individualCustomerFormObjectSchema),
    defaultValues: {
      name: "",
      ordinal: undefined, // Use undefined for empty number fields
      month: "",
      location: "",
      ward: "",
      assignedBulkMeterId: undefined,
      status: "Active",
    },
  });

  React.useEffect(() => {
    if (!propBulkMeters || propBulkMeters.length === 0) {
      initializeBulkMeters().then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setDynamicBulkMeters(fetchedBms);
        if (fetchedBms.length === 0 && open) {
            console.warn("IndividualCustomerFormDialog: No bulk meters available on mount for selection.");
        }
      });
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
        ordinal: defaultValues.ordinal ?? undefined,
        month: defaultValues.month || "",
        location: defaultValues.location || "",
        ward: defaultValues.ward || "",
        assignedBulkMeterId: defaultValues.assignedBulkMeterId,
        status: defaultValues.status || "Active",
      });
      setIsBulkMeterSelected(!!defaultValues.assignedBulkMeterId);
    } else {
      form.reset({
        name: "",
        ordinal: undefined,
        month: "",
        location: "",
        ward: "",
        assignedBulkMeterId: undefined,
        status: "Active",
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
                name="ordinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordinal *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value === undefined || field.value === null || Number.isNaN(field.value as number) ? "" : String(field.value)}
                        onChange={e => {
                          const valStr = e.target.value;
                          if (valStr === "") {
                            field.onChange(undefined);
                          } else {
                            const parsed = parseInt(valStr, 10);
                            field.onChange(Number.isNaN(parsed) ? undefined : parsed);
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
                    <FormLabel>Registration Month *</FormLabel>
                     <DatePicker
                        date={field.value && isValid(parse(field.value, "yyyy-MM", new Date())) ? parse(field.value, "yyyy-MM", new Date()) : undefined}
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

