
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
import { bulkMeterDataEntrySchema, type BulkMeterDataEntryFormValues, meterSizeOptions } from "./customer-data-entry-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { addBulkMeter as addBulkMeterToStore, initializeBulkMeters, initializeCustomers, getBranches, subscribeToBranches, initializeBranches as initializeAdminBranches } from "@/lib/data-store";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { Branch } from "../branches/branch-types";

const BRANCH_UNASSIGNED_VALUE = "_SELECT_BRANCH_BULK_METER_";

export function BulkMeterDataEntryForm() {
  const { toast } = useToast();
  const [availableBranches, setAvailableBranches] = React.useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(true);

  React.useEffect(() => {
    initializeCustomers();
    initializeBulkMeters();
    
    setIsLoadingBranches(true);
    initializeAdminBranches().then(() => {
        setAvailableBranches(getBranches());
        setIsLoadingBranches(false);
    });
    const unsubscribeBranches = subscribeToBranches((updatedBranches) => {
        setAvailableBranches(updatedBranches);
        setIsLoadingBranches(false);
    });
    return () => unsubscribeBranches();
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
      location: "", // Will be set by branch selection
      ward: "",
      branchId: undefined, // Initialize branchId
    },
  });

  async function onSubmit(data: BulkMeterDataEntryFormValues) {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = { 
      ...data, 
      branchId: data.branchId === BRANCH_UNASSIGNED_VALUE ? undefined : data.branchId,
      status: "Active", 
      paymentStatus: "Unpaid", 
    };
    
    const result = await addBulkMeterToStore(bulkMeterDataForStore);
    if (result.success && result.data) {
      toast({
        title: "Data Entry Submitted",
        description: `Data for bulk meter ${result.data.name} has been successfully recorded.`,
      });
      form.reset(); 
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.message || "Could not record bulk meter data. Please check console for errors.",
      });
    }
  }
  
  const handleBranchChange = (branchIdValue: string) => {
    const selectedBranch = availableBranches.find(b => b.id === branchIdValue);
    if (selectedBranch) {
      form.setValue("location", selectedBranch.name); 
      form.setValue("branchId", selectedBranch.id);
    } else if (branchIdValue === BRANCH_UNASSIGNED_VALUE) {
      form.setValue("location", ""); 
      form.setValue("branchId", undefined);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]"> 
      <Card className="shadow-lg w-full">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="branchId" 
                  render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Assign to Branch (sets Location)</FormLabel>
                      <Select
                        onValueChange={(value) => handleBranchChange(value)}
                        value={field.value || BRANCH_UNASSIGNED_VALUE}
                        disabled={isLoadingBranches || form.formState.isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select a branch"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={BRANCH_UNASSIGNED_VALUE}>None (Manual Location)</SelectItem>
                          {availableBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
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
                      <FormLabel>Bulk Meter Name / Identifier *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bulk meter name" {...field} />
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
                        <Input placeholder="Enter customer key number" {...field} />
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
                        <Input placeholder="Enter contract number" {...field} />
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a meter size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {meterSizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="Enter meter number" {...field} />
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
                          placeholder="Enter previous reading"
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
                          placeholder="Enter current reading"
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
                        <Input placeholder="Enter specific area" {...field} />
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
                      <FormLabel>Location / Sub-City * (set by Branch selection)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location / sub-city" {...field} readOnly={!!form.getValues().branchId && form.getValues().branchId !== BRANCH_UNASSIGNED_VALUE} />
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
                        <Input placeholder="Enter ward / woreda" {...field} />
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
