
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { baseBulkMeterDataSchema, meterSizeOptions } from "@/app/admin/data-entry/customer-data-entry-types";
import type { BulkMeter } from "./bulk-meter-types";
import { bulkMeterStatuses } from "./bulk-meter-types";
import { paymentStatuses } from "@/lib/billing"; 
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";
import { getBranches, subscribeToBranches, initializeBranches as initializeAdminBranches } from "@/lib/data-store";
import type { Branch } from "../branches/branch-types";

const BRANCH_UNASSIGNED_VALUE = "_SELECT_BRANCH_BULK_METER_DIALOG_";

const bulkMeterFormObjectSchema = baseBulkMeterDataSchema.extend({
  status: z.enum(bulkMeterStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  paymentStatus: z.enum(paymentStatuses, { errorMap: () => ({ message: "Please select a valid payment status."}) }),
  branchId: z.string().optional(), // Add branchId to schema
});

const bulkMeterFormSchema = bulkMeterFormObjectSchema.refine(data => data.currentReading >= data.previousReading, {
  message: "Current Reading must be greater than or equal to Previous Reading.",
  path: ["currentReading"],
});


export type BulkMeterFormValues = z.infer<typeof bulkMeterFormSchema>; 

interface BulkMeterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BulkMeterFormValues) => void;
  defaultValues?: BulkMeter | null;
  staffBranchName?: string; // New prop for staff users
}

export function BulkMeterFormDialog({ open, onOpenChange, onSubmit, defaultValues, staffBranchName }: BulkMeterFormDialogProps) {
  const [availableBranches, setAvailableBranches] = React.useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(true);

  React.useEffect(() => {
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
  
  const form = useForm<BulkMeterFormValues>({
    resolver: zodResolver(bulkMeterFormSchema),
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
      branchId: undefined,
      status: "Active", 
      paymentStatus: "Unpaid", 
      xCoordinate: undefined,
      yCoordinate: undefined,
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...defaultValues,
        meterSize: defaultValues.meterSize ?? undefined,
        previousReading: defaultValues.previousReading ?? undefined,
        currentReading: defaultValues.currentReading ?? undefined,
        branchId: defaultValues.branchId || undefined,
        status: defaultValues.status || "Active",
        paymentStatus: defaultValues.paymentStatus || "Unpaid",
        xCoordinate: defaultValues.xCoordinate ?? undefined,
        yCoordinate: defaultValues.yCoordinate ?? undefined,
      });
    } else {
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
        location: staffBranchName || "", // Use staff branch name for location
        ward: "",
        branchId: undefined,
        status: "Active",
        paymentStatus: "Unpaid",
        xCoordinate: undefined,
        yCoordinate: undefined,
      });
    }
  }, [defaultValues, form, open, staffBranchName]);

  const handleSubmit = (data: BulkMeterFormValues) => {
     const submissionData = {
      ...data,
      branchId: data.branchId === BRANCH_UNASSIGNED_VALUE ? undefined : data.branchId,
    };
    onSubmit(submissionData); 
    onOpenChange(false); 
  };
  
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Bulk Meter" : "Add New Bulk Meter"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of the bulk meter." : "Fill in the details to add a new bulk meter."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffBranchName ? (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <Input value={staffBranchName} readOnly disabled className="bg-muted/50" />
                  </FormControl>
                </FormItem>
              ) : (
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
              )}
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value ? String(field.value) : undefined}
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
                    <FormLabel>Initial Previous Reading *</FormLabel>
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
                    <FormLabel>Initial Current Reading *</FormLabel>
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
                    <FormLabel>Initial Reading Month *</FormLabel>
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
                    <FormLabel>Location / Sub-City * {staffBranchName ? '' : '(set by Branch selection)'}</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={!!staffBranchName || (!!form.getValues().branchId && form.getValues().branchId !== BRANCH_UNASSIGNED_VALUE)} />
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
                name="xCoordinate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X Coordinate (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
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
                name="yCoordinate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Y Coordinate (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "Active"} defaultValue={field.value || "Active"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bulkMeterStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "Unpaid"} defaultValue={field.value || "Unpaid"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {defaultValues ? "Save Changes" : "Add Bulk Meter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
