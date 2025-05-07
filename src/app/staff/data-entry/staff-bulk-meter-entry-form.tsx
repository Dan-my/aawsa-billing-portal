
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { bulkMeterDataEntrySchema, type BulkMeterDataEntryFormValues } from "@/app/admin/data-entry/customer-data-entry-types"; // Re-use admin schema
import { ScrollArea } from "@/components/ui/scroll-area";
import { addBulkMeter as addBulkMeterToStore, initializeBulkMeters, getBulkMeters } from "@/lib/data-store";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { initialBulkMeters as defaultInitialBulkMeters } from "@/app/admin/bulk-meters/page";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

interface StaffBulkMeterEntryFormProps {
  branchName: string; // To potentially filter or for display
}

export function StaffBulkMeterEntryForm({ branchName }: StaffBulkMeterEntryFormProps) {
  const { toast } = useToast();

  React.useEffect(() => {
    // Ensure store is initialized if not already
    if (getBulkMeters().length === 0) initializeBulkMeters(defaultInitialBulkMeters);
  }, []);

  const form = useForm<BulkMeterDataEntryFormValues>({
    resolver: zodResolver(bulkMeterDataEntrySchema),
    defaultValues: {
      name: "",
      customerKeyNumber: "",
      contractNumber: "",
      meterSize: undefined,
      meterNumber: "",
      previousReading: undefined,
      currentReading: undefined,
      month: "", 
      specificArea: "",
      location: "", // Could be pre-filled based on branchName if logic allows
      ward: "",
    },
  });

  function onSubmit(data: BulkMeterDataEntryFormValues) {
    // Staff entries default to Active status
    const bulkMeterDataForStore: Omit<BulkMeter, 'id' | 'status'> & { status: 'Active' | 'Maintenance' | 'Decommissioned'} = { 
        ...data, 
        status: "Active" 
    };
    
    addBulkMeterToStore(bulkMeterDataForStore as Omit<BulkMeter, 'id'>); // Type assertion matches store function
    toast({
      title: "Bulk Meter Data Submitted",
      description: `Data for bulk meter ${data.name} (Branch: ${branchName}) has been successfully recorded.`,
    });
    form.reset(); 
  }

  return (
    <ScrollArea className="h-auto max-h-[calc(100vh-300px)]"> {/* Adjusted height */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bulk Meter Name / Identifier *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bole Airport Feeder BM" {...field} />
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
                    <Input placeholder="e.g., BULKKEY789" {...field} />
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
                    <Input placeholder="e.g., BULKCONTRACT456" {...field} />
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
                      placeholder="e.g., 3.0" 
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
                    <Input placeholder="e.g., BMTR9012" {...field} />
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
                      placeholder="e.g., 25000.00" 
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
                      placeholder="e.g., 26500.75" 
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
                    placeholder="Select reading month"
                  />
                  <FormDescription>Month and year of the reading.</FormDescription>
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
                    <Input placeholder="e.g., Airport Cargo Zone" {...field} />
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
                    <Input placeholder="e.g., Woreda 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Bulk Meter Data"}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  );
}

