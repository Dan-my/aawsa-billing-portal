
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
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers, getCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";
import { customerTypes, sewerageConnections } from "@/lib/billing"; // For default values

interface StaffIndividualCustomerEntryFormProps {
  branchName: string; 
}

// Value to represent no bulk meter selected, different from an actual ID
const NO_BULK_METER_SELECTED_VALUE = "_NO_BM_SELECTED_";

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isLoadingBulkMeters, setIsLoadingBulkMeters] = React.useState(true);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(false);

  const form = useForm<SimplifiedStaffIndividualCustomerFormValues>({ 
    resolver: zodResolver(simplifiedStaffIndividualCustomerSchema), 
    defaultValues: {
      assignedBulkMeterId: NO_BULK_METER_SELECTED_VALUE, // Default to the placeholder value
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
        initializeCustomers() // Though not directly used, good practice to init stores
    ]).then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setAvailableBulkMeters(fetchedBms);
        setIsLoadingBulkMeters(false);
    });

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
      // If bulk meters list becomes empty and one was selected, reset selection state
      if (newBms.length === 0 && isBulkMeterSelected) {
        setIsBulkMeterSelected(false);
        form.setValue("assignedBulkMeterId", NO_BULK_METER_SELECTED_VALUE);
      }
    });
    return () => unsubscribe();
  }, [form, isBulkMeterSelected]); 

  const handleBulkMeterChange = (value: string | undefined) => {
    form.setValue("assignedBulkMeterId", value);
    if (value && value !== NO_BULK_METER_SELECTED_VALUE) {
      setIsBulkMeterSelected(true);
    } else {
      setIsBulkMeterSelected(false);
    }
  };

  async function onSubmit(data: SimplifiedStaffIndividualCustomerFormValues) { 
    if (!data.assignedBulkMeterId || data.assignedBulkMeterId === NO_BULK_METER_SELECTED_VALUE) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please select a bulk meter.",
        });
        return;
    }

    const customerDataForStore: Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at'> = {
      name: data.name,
      assignedBulkMeterId: data.assignedBulkMeterId,
      ordinal: data.ordinal,
      month: data.month, // This is Registration Month, used as initial reading month
      location: data.location,
      ward: data.ward,
      // --- Default values for fields not in this simplified form ---
      customerKeyNumber: `CK-${Date.now().toString().slice(-6)}`, // Example temporary key
      contractNumber: `CON-${Date.now().toString().slice(-6)}`, // Example temporary contract
      customerType: "Domestic", // Default
      bookNumber: "N/A", // Default
      meterSize: 0.75, // Default
      meterNumber: `MTR-${Date.now().toString().slice(-6)}`, // Example temporary meter no.
      previousReading: 0, // Default
      currentReading: 0, // Default
      specificArea: data.location, // Use location as specific area for simplicity
      sewerageConnection: "No", // Default
      status: "Active", // Default
      paymentStatus: "Unpaid", // Default
      calculatedBill: 0, // Will be recalculated by data-store or DB logic if needed
    };
    
    const result = await addCustomerToStore(customerDataForStore as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'calculatedBill'>);
    if (result.success && result.data) {
        toast({
        title: "Individual Customer Data Submitted",
        description: `Data for customer ${result.data.name} (Branch: ${branchName}) has been recorded.`,
        });
        form.reset({
            assignedBulkMeterId: NO_BULK_METER_SELECTED_VALUE,
            name: "",
            ordinal: undefined,
            month: "",
            location: "",
            ward: "",
        }); 
        setIsBulkMeterSelected(false);
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
                     onValueChange={handleBulkMeterChange} 
                     value={field.value === NO_BULK_METER_SELECTED_VALUE ? "" : field.value} // Pass empty string to show placeholder
                     disabled={isLoadingBulkMeters || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBulkMeters ? "Loading..." : "Select a bulk meter first"}/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {isLoadingBulkMeters && <SelectItem value="loading-bms-placeholder" disabled>Loading...</SelectItem>}
                       {!isLoadingBulkMeters && availableBulkMeters.length === 0 && (
                            <SelectItem value="no-bms-available-placeholder" disabled>
                              No bulk meters available
                            </SelectItem>
                        )}
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
                      placeholder="Enter ordinal"
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
