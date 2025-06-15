
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import {
  individualCustomerDataEntrySchemaNew, // Use new schema
  type IndividualCustomerDataEntryFormValuesNew, // Use new form values type
} from "@/app/admin/data-entry/customer-data-entry-types"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers, getCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { initialBulkMeters as defaultInitialBulkMeters } from "@/app/admin/bulk-meters/page"; // Keep for fallback
import { initialCustomers as defaultInitialCustomers } from "@/app/admin/individual-customers/page"; // Keep for fallback
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

interface StaffIndividualCustomerEntryFormProps {
  branchName: string; 
}

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(false);


  React.useEffect(() => {
    // Fallback initialization logic if needed (e.g., if Supabase isn't fully set up or data isn't available)
    if (getBulkMeters().length === 0) initializeBulkMeters(defaultInitialBulkMeters);
    if (getCustomers().length === 0) initializeCustomers(defaultInitialCustomers);
    
    const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
    setAvailableBulkMeters(fetchedBms);
    
    const currentAssignedBulkMeterId = form.getValues("assignedBulkMeterId");
    if (fetchedBms.length > 0 && currentAssignedBulkMeterId) {
        setIsBulkMeterSelected(true);
    } else if (fetchedBms.length === 0) {
        setIsBulkMeterSelected(false);
    }

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
      if (newBms.length === 0) {
        setIsBulkMeterSelected(false);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // form dependency removed

  const form = useForm<IndividualCustomerDataEntryFormValuesNew>({ // Use new form values type
    resolver: zodResolver(individualCustomerDataEntrySchemaNew), // Use new schema
    defaultValues: {
      name: "",
      ordinal: undefined,
      month: "", 
      location: "", 
      ward: "",
      assignedBulkMeterId: undefined,
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "assignedBulkMeterId") {
        setIsBulkMeterSelected(!!value.assignedBulkMeterId && availableBulkMeters.length > 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, availableBulkMeters]);

  function onSubmit(data: IndividualCustomerDataEntryFormValuesNew) { // Use new form values type
    const customerDataForStore = {
        ...data,
        // Status will be defaulted in addCustomerToStore or Supabase
    } as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status'>;
    
    addCustomerToStore(customerDataForStore);
    toast({
      title: "Individual Customer Data Submitted",
      description: `Data for customer ${data.name} (Branch: ${branchName}) has been recorded.`,
    });
    form.reset(); 
    setIsBulkMeterSelected(false);
  }

  const commonFormFieldProps = {
    disabled: !isBulkMeterSelected,
  };

  return (
    <ScrollArea className="h-[calc(100vh-380px)]"> 
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="assignedBulkMeterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Bulk Meter *</FormLabel>
                  <Select 
                     onValueChange={(value) => {
                        field.onChange(value);
                        setIsBulkMeterSelected(!!value && availableBulkMeters.length > 0);
                     }} 
                    value={field.value || ""} 
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bulk meter first"/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {availableBulkMeters.length === 0 && <SelectItem value="no-bms-staff" disabled>No bulk meters available</SelectItem>}
                      {availableBulkMeters.map((bm) => (
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
                    <Input {...field} {...commonFormFieldProps} />
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
                    date={field.value ? parse(field.value, "yyyy-MM", new Date()) : undefined}
                    setDate={(selectedDate) => {
                      field.onChange(selectedDate ? format(selectedDate, "yyyy-MM") : "");
                    }}
                    disabledTrigger={!isBulkMeterSelected}
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
                    <Input {...field} {...commonFormFieldProps} />
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
                    <Input {...field} {...commonFormFieldProps} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || !isBulkMeterSelected}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Individual Customer Data"}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  );
}
