
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
  simplifiedStaffIndividualCustomerSchema,
  type SimplifiedStaffIndividualCustomerFormValues,
} from "@/app/admin/data-entry/customer-data-entry-types"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";

interface StaffIndividualCustomerEntryFormProps {
  branchName: string; 
}

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isLoadingBulkMeters, setIsLoadingBulkMeters] = React.useState(true);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(false);

  const form = useForm<SimplifiedStaffIndividualCustomerFormValues>({ 
    resolver: zodResolver(simplifiedStaffIndividualCustomerSchema), 
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
        initializeCustomers() // Ensure customers are also initialized if needed for any other logic
    ]).then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setAvailableBulkMeters(fetchedBms);
        setIsLoadingBulkMeters(false);
        
        // Check if initial form value for assignedBulkMeterId is valid and set selected state
        const currentAssignedBulkMeterId = form.getValues("assignedBulkMeterId");
        if (fetchedBms.length > 0 && currentAssignedBulkMeterId && fetchedBms.find(bm => bm.id === currentAssignedBulkMeterId)) {
            setIsBulkMeterSelected(true);
        } else {
            setIsBulkMeterSelected(false);
        }
    });

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
      if (newBms.length === 0) {
        setIsBulkMeterSelected(false); // If BMs become empty, unselect
      }
      setIsLoadingBulkMeters(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // form removed from dependencies to avoid re-runs on form state change

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "assignedBulkMeterId") {
        setIsBulkMeterSelected(!!value.assignedBulkMeterId && availableBulkMeters.length > 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, availableBulkMeters]);


  async function onSubmit(data: SimplifiedStaffIndividualCustomerFormValues) { 
    const customerDataForStore: Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'> = {
      ...data,
      // Provide sensible defaults for fields not in the simplified staff form
      customerKeyNumber: `CUST-KEY-${Date.now()}`, // Placeholder
      contractNumber: `CONTR-${Date.now()}`, // Placeholder
      customerType: "Domestic", // Default
      bookNumber: "N/A", // Default
      meterSize: 0.75, // Default
      meterNumber: `MTR-${Date.now()}`, // Placeholder
      previousReading: 0, // Default
      currentReading: 0, // Default
      specificArea: data.location || "N/A", // Use location if specificArea is not in form
      sewerageConnection: "No", // Default
    };
    
    const result = await addCustomerToStore(customerDataForStore);
    if (result.success && result.data) {
        toast({
        title: "Data Entry Submitted",
        description: `Data for individual customer ${result.data.name} (Branch: ${branchName}) has been successfully recorded.`,
        });
        form.reset();
        setIsBulkMeterSelected(false);
    } else {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: result.message || "Could not record customer data. Please check console for errors.",
        });
    }
  }
  
  const handleBulkMeterChange = (value: string | undefined) => {
    form.setValue("assignedBulkMeterId", value);
    setIsBulkMeterSelected(!!value && availableBulkMeters.length > 0);
  };
  
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
                     onValueChange={handleBulkMeterChange} 
                     value={field.value || ""}
                     disabled={isLoadingBulkMeters || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBulkMeters ? "Loading..." : "Select a bulk meter first"}/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {availableBulkMeters.length === 0 && !isLoadingBulkMeters && (
                        <SelectItem value="no-bms-staff-entry" disabled>No bulk meters available</SelectItem>
                       )}
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
                    date={field.value && isValid(parse(field.value, "yyyy-MM", new Date())) ? parse(field.value, "yyyy-MM", new Date()) : undefined}
                    setDate={(date) => field.onChange(date ? format(date, "yyyy-MM") : "")}
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
