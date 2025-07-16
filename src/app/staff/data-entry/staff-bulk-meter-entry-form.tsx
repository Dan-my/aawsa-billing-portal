
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
import { bulkMeterDataEntrySchema, type BulkMeterDataEntryFormValues, meterSizeOptions, subCityOptions, woredaOptions } from "@/app/admin/data-entry/customer-data-entry-types"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { addBulkMeter as addBulkMeterToStore, initializeBulkMeters, getBulkMeters, getBranches, initializeBranches } from "@/lib/data-store";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";
import { customerTypes, sewerageConnections } from "@/lib/billing";

interface StaffBulkMeterEntryFormProps {
  branchName: string; 
}

export function StaffBulkMeterEntryForm({ branchName }: StaffBulkMeterEntryFormProps) {
  const { toast } = useToast();
  const [staffBranchId, setStaffBranchId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    initializeBranches().then(() => {
      const allBranches = getBranches();
      const normalizedStaffBranchName = branchName.trim().toLowerCase();
      const staffBranch = allBranches.find(b => {
        const normalizedBranchName = b.name.trim().toLowerCase();
        return normalizedBranchName.includes(normalizedStaffBranchName) || normalizedStaffBranchName.includes(normalizedBranchName);
      });
      if (staffBranch) {
        setStaffBranchId(staffBranch.id);
      }
    });

    if (getBulkMeters().length === 0) initializeBulkMeters();
  }, [branchName]);

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
      location: branchName || "", 
      ward: "",
      chargeGroup: "Non-domestic",
      sewerageConnection: "No",
      xCoordinate: undefined,
      yCoordinate: undefined,
    },
  });

  React.useEffect(() => {
    // Reset location if branchName changes and form is pristine for location
    if (form.formState.isDirty && form.getFieldState('location').isDirty) return;
    form.reset({ ...form.getValues(), location: branchName });
  }, [branchName, form]);


  async function onSubmit(data: BulkMeterDataEntryFormValues) {
    const bulkMeterDataForStore = {
        ...data, 
        branchId: staffBranchId, // Add the staff's branchId to the submission
        status: "Active",
        paymentStatus: "Unpaid",
        outStandingbill: 0,
    };
    
    await addBulkMeterToStore(bulkMeterDataForStore as BulkMeter); 
    toast({
      title: "Bulk Meter Data Submitted",
      description: `Data for bulk meter ${data.name} (Branch: ${branchName}) has been successfully recorded.`,
    });
    form.reset({
        name: "",
        customerKeyNumber: "",
        contractNumber: "",
        meterSize: undefined,
        meterNumber: "",
        previousReading: undefined,
        currentReading: undefined,
        month: "",
        specificArea: "",
        location: branchName || "", // Reset location to current branchName
        ward: "",
        chargeGroup: "Non-domestic",
        sewerageConnection: "No",
        xCoordinate: undefined,
        yCoordinate: undefined,
    }); 
  }

  return (
    <ScrollArea className="h-[calc(100vh-380px)]"> 
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem>
                <FormLabel>Branch</FormLabel>
                <FormControl>
                    <Input value={branchName} readOnly disabled className="bg-muted/50"/>
                </FormControl>
            </FormItem>
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
                   <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
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
                  <FormLabel>Sub-City *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Sub-City" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subCityOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="ward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Woreda *</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Woreda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {woredaOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="chargeGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charge Group *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="Non-domestic">
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customerTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="No">
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sewerageConnections.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="xCoordinate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>X Coordinate (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" step="any" placeholder="e.g., 9.005401" {...field}
                      value={field.value ?? ""}
                      onChange={e => { const val = e.target.value; field.onChange(val === "" ? undefined : parseFloat(val)); }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yCoordinate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Y Coordinate (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" step="any" placeholder="e.g., 38.763611" {...field}
                      value={field.value ?? ""}
                      onChange={e => { const val = e.target.value; field.onChange(val === "" ? undefined : parseFloat(val)); }}
                    />
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
