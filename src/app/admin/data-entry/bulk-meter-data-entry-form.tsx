
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
import { useToast } from "@/hooks/use-toast";
import { bulkMeterDataEntrySchema, type BulkMeterDataEntryFormValues } from "./customer-data-entry-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { addBulkMeter as addBulkMeterToStore, initializeBulkMeters, initializeCustomers } from "@/lib/data-store";
// import { initialBulkMeters as defaultInitialBulkMeters } from "../bulk-meters/page"; // Fallback, not primary
// import { initialCustomers as defaultInitialCustomers } from "../individual-customers/page"; // Fallback
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";

export function BulkMeterDataEntryForm() {
  const { toast } = useToast();

  React.useEffect(() => {
    // Ensure stores are initialized (these will try to fetch from Supabase)
    initializeCustomers();
    initializeBulkMeters();
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
      location: "",
      ward: "",
    },
  });

  async function onSubmit(data: BulkMeterDataEntryFormValues) {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = { 
      ...data, 
      status: "Active", 
      paymentStatus: "Unpaid", 
    };
    
    const result = await addBulkMeterToStore(bulkMeterDataForStore);
    if (result) {
      toast({
        title: "Data Entry Submitted",
        description: `Data for bulk meter ${data.name} has been successfully recorded.`,
      });
      form.reset(); 
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not record bulk meter data. Please check console for errors.",
      });
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]"> 
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
