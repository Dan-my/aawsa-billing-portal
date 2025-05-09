
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
  individualCustomerDataEntrySchema,
  type IndividualCustomerDataEntryFormValues,
  customerTypes,
  sewerageConnections,
} from "@/app/admin/data-entry/customer-data-entry-types"; // Re-use admin schema
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Card, CardContent } from "@/components/ui/card"; // Keep Card structure for consistency
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers, getCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { TARIFF_RATE } from "@/app/admin/individual-customers/individual-customer-types";
import { initialBulkMeters as defaultInitialBulkMeters } from "@/app/admin/bulk-meters/page";
import { initialCustomers as defaultInitialCustomers } from "@/app/admin/individual-customers/page";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

interface StaffIndividualCustomerEntryFormProps {
  branchName: string; // To potentially filter customers or for display
}

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    // Ensure stores are initialized if not already
    if (getCustomers().length === 0) initializeCustomers(defaultInitialCustomers);
    if (getBulkMeters().length === 0) initializeBulkMeters(defaultInitialBulkMeters);
    
    setAvailableBulkMeters(getBulkMeters().map(bm => ({ id: bm.id, name: bm.name })));
    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      setAvailableBulkMeters(updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<IndividualCustomerDataEntryFormValues>({
    resolver: zodResolver(individualCustomerDataEntrySchema),
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
      location: "", // Could be pre-filled based on branchName if logic allows
      ward: "",
      sewerageConnection: undefined,
      assignedBulkMeterId: undefined,
    },
  });

  function onSubmit(data: IndividualCustomerDataEntryFormValues) {
    const usage = data.currentReading - data.previousReading;
    const calculatedBill = usage * TARIFF_RATE;

    // Staff entries default to Active and Unpaid
    const customerDataForStore: Omit<IndividualCustomer, 'id'> = {
      ...data,
      status: "Active", 
      paymentStatus: "Unpaid", 
      calculatedBill: calculatedBill,
    };
    
    addCustomerToStore(customerDataForStore);
    toast({
      title: "Individual Customer Data Submitted",
      description: `Data for customer ${data.name} (Branch: ${branchName}) has been recorded.`,
    });
    form.reset(); 
  }

  return (
    <ScrollArea className="h-[calc(100vh-380px)]"> {/* Adjusted height */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="assignedBulkMeterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Bulk Meter *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBulkMeters.map((bm) => (
                        <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                      ))}
                       {availableBulkMeters.length === 0 && <SelectItem value="loading-bms-staff" disabled>Loading bulk meters...</SelectItem>}
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined} 
                    defaultValue={field.value || undefined}
                  >
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
                  <FormLabel>Previous Reading *</FormLabel>
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
                  <FormLabel>Current Reading *</FormLabel>
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
                  <FormLabel>Reading Month *</FormLabel>
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined} 
                    defaultValue={field.value || undefined}
                  >
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
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Individual Customer Data"}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  );
}

