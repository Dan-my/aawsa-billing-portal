
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
import { bulkMeterDataEntrySchema, type BulkMeterDataEntryFormValues } from "./customer-data-entry-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { addBulkMeter as addBulkMeterToStore, initializeBulkMeters, initializeCustomers } from "@/lib/data-store";
import { initialBulkMeters as defaultInitialBulkMeters } from "../bulk-meters/page";
import { initialCustomers as defaultInitialCustomers } from "../individual-customers/page";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

export function BulkMeterDataEntryForm() {
  const { toast } = useToast();

  React.useEffect(() => {
    // Ensure stores are initialized
    initializeCustomers(defaultInitialCustomers);
    initializeBulkMeters(defaultInitialBulkMeters);
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
      month: "", // YYYY-MM string
      specificArea: "",
      location: "",
      ward: "",
    },
  });

  function onSubmit(data: BulkMeterDataEntryFormValues) {
    // Add status to the data before sending to store
    const bulkMeterDataForStore = { ...data, status: "Active" } as const; // Default to Active
    
    addBulkMeterToStore(bulkMeterDataForStore);
    toast({
      title: "Data Entry Submitted",
      description: `Data for bulk meter ${data.name} has been successfully recorded.`,
    });
    form.reset(); // Reset form after successful submission
  }

  return (
    <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-200px)]">
      <Card className="shadow-lg w-full">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bulk Meter Name / Identifier *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kality Industrial Zone Meter 1" {...field} />
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
                        <Input placeholder="e.g., BULKCUST001" {...field} />
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
                        <Input placeholder="e.g., BULKCONTR001" {...field} />
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
                        <Input type="number" step="0.1" placeholder="e.g., 2.0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
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
                        <Input placeholder="e.g., BULKMTR789" {...field} />
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
                        <Input type="number" step="0.01" placeholder="e.g., 1000.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
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
                        <Input type="number" step="0.01" placeholder="e.g., 1500.50" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
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
                      <FormDescription>Enter the month and year of the reading.</FormDescription>
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
                        <Input placeholder="e.g., Kality Zone 1, Block A" {...field} />
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
                        <Input placeholder="e.g., Kality Sub-City" {...field} />
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
                        <Input placeholder="e.g., Woreda 05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit Bulk Meter Reading"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
