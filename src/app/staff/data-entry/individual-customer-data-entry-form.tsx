
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
  individualCustomerDataEntrySchemaNew, 
  type IndividualCustomerDataEntryFormValuesNew, 
} from "@/app/admin/data-entry/customer-data-entry-types"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers, getCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

interface StaffIndividualCustomerEntryFormProps {
  branchName: string; 
}

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isLoadingBulkMeters, setIsLoadingBulkMeters] = React.useState(true);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(false);


  const form = useForm<IndividualCustomerDataEntryFormValuesNew>({ 
    resolver: zodResolver(individualCustomerDataEntrySchemaNew), 
    defaultValues: {
      assignedBulkMeterId: undefined,
      name: "",
      ordinal: undefined,
      month: "", 
      location: "", 
      ward: "",
    },
  });

  React.useEffect(() => {
    setIsLoadingBulkMeters(true);
    Promise.all([
        initializeBulkMeters(),
        initializeCustomers() // Ensure customers are also initialized if needed by other logic, though not directly used here
    ]).then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setAvailableBulkMeters(fetchedBms);
        setIsLoadingBulkMeters(false);

        const currentAssignedBulkMeterId = form.getValues("assignedBulkMeterId");
        if (fetchedBms.length > 0 && currentAssignedBulkMeterId) {
            setIsBulkMeterSelected(true);
        } else {
            setIsBulkMeterSelected(false);
        }
    });

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
      setIsLoadingBulkMeters(false);
      if (newBms.length === 0) {
        setIsBulkMeterSelected(false); 
        form.resetField("assignedBulkMeterId"); // Clear selection if no bulk meters
      }
    });
    return () => unsubscribe();
  }, [form]); 

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "assignedBulkMeterId") {
        const hasSelection = !!value.assignedBulkMeterId && availableBulkMeters.some(bm => bm.id === value.assignedBulkMeterId);
        setIsBulkMeterSelected(hasSelection);
        if (!hasSelection) {
          // Reset dependent fields if bulk meter is deselected or becomes invalid
          form.resetField("name");
          form.resetField("ordinal");
          form.resetField("month");
          form.resetField("location");
          form.resetField("ward");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, availableBulkMeters]);

  async function onSubmit(data: IndividualCustomerDataEntryFormValuesNew) { 
    // Construct the full object required by addCustomerToStore
    // providing defaults for fields not on this simplified staff form
    const customerDataForStore: Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'> = {
      ...data, // includes name, ordinal, month, location, ward, assignedBulkMeterId
      customerKeyNumber: `CUST-KEY-${Date.now()}`, // Placeholder
      contractNumber: `CONTR-${Date.now()}`,    // Placeholder
      customerType: 'Domestic',                   // Default
      bookNumber: 'N/A',                          // Default
      meterSize: 0.5,                             // Default (e.g., common small meter size)
      meterNumber: `MTR-${Date.now()}`,          // Placeholder
      previousReading: 0,                         // Default
      currentReading: 0,                          // Default
      specificArea: data.location,                // Use location as specific area for now
      sewerageConnection: 'No',                   // Default
    };
    
    const result = await addCustomerToStore(customerDataForStore);
    if (result.success && result.data) {
        toast({
        title: "Individual Customer Data Submitted",
        description: `Data for customer ${result.data.name} (Branch: ${branchName}) has been recorded.`,
        });
        form.reset(); 
        setIsBulkMeterSelected(false); // Reset prerequisite state
    } else {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: result.message || "Could not record customer data.",
        });
    }
  }

  const commonFormFieldProps = {
    disabled: !isBulkMeterSelected || form.formState.isSubmitting,
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
                        // State update for isBulkMeterSelected is handled by the watch effect
                     }} 
                    value={field.value || ""} 
                    disabled={isLoadingBulkMeters || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBulkMeters ? "Loading bulk meters..." : "Select a bulk meter first"}/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {isLoadingBulkMeters && <SelectItem value="loading-bms" disabled>Loading...</SelectItem>}
                       {!isLoadingBulkMeters && availableBulkMeters.length === 0 && <SelectItem value="no-bms-staff" disabled>No bulk meters available</SelectItem>}
                      {!isLoadingBulkMeters && availableBulkMeters.map((bm) => (
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
                    <Input placeholder="Enter customer name" {...field} {...commonFormFieldProps} />
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
                      placeholder="Enter ordinal (sequence number)"
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
                    disabledTrigger={!isBulkMeterSelected || form.formState.isSubmitting}
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
                    <Input placeholder="Enter location" {...field} {...commonFormFieldProps} />
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
                    <Input placeholder="Enter ward or woreda" {...field} {...commonFormFieldProps} />
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
