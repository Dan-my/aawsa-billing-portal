
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
import { baseIndividualCustomerDataSchema, meterSizeOptions, subCityOptions, woredaOptions } from "@/app/admin/data-entry/customer-data-entry-types";
import type { IndividualCustomer } from "./individual-customer-types";
import { individualCustomerStatuses } from "./individual-customer-types";
import { getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, getBranches, subscribeToBranches, initializeBranches as initializeAdminBranches } from "@/lib/data-store";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";
import { customerTypes, sewerageConnections, paymentStatuses } from "@/lib/billing";
import type { Branch } from "../branches/branch-types";

const individualCustomerFormObjectSchema = baseIndividualCustomerDataSchema.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  paymentStatus: z.enum(paymentStatuses, { errorMap: () => ({ message: "Please select a valid payment status."}) }),
  branchId: z.string().optional(), // Add branchId to schema
  arrears: z.coerce.number().min(0, { message: "Arrears cannot be negative." }),
});

export type IndividualCustomerFormValues = z.infer<typeof individualCustomerFormObjectSchema>;

interface IndividualCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IndividualCustomerFormValues) => void;
  defaultValues?: IndividualCustomer | null;
  bulkMeters?: { customerKeyNumber: string; name: string }[];
  staffBranchName?: string;
}

const UNASSIGNED_BULK_METER_VALUE = "_SELECT_NONE_BULK_METER_";
const BRANCH_UNASSIGNED_VALUE = "_SELECT_BRANCH_INDIVIDUAL_DIALOG_";

export function IndividualCustomerFormDialog({ open, onOpenChange, onSubmit, defaultValues, bulkMeters: propBulkMeters, staffBranchName }: IndividualCustomerFormDialogProps) {
  const [dynamicBulkMeters, setDynamicBulkMeters] = React.useState<{ customerKeyNumber: string; name: string }[]>(propBulkMeters || []);
  const [availableBranches, setAvailableBranches] = React.useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(true);
  
  const form = useForm<IndividualCustomerFormValues>({
    resolver: zodResolver(individualCustomerFormObjectSchema),
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
      location: "",
      ward: "",
      sewerageConnection: undefined,
      assignedBulkMeterId: UNASSIGNED_BULK_METER_VALUE,
      branchId: undefined,
      status: "Active",
      paymentStatus: "Unpaid",
      arrears: 0,
    },
  });

  React.useEffect(() => {
    setIsLoadingBranches(true);
    initializeAdminBranches().then(() => {
        setAvailableBranches(getBranches());
        setIsLoadingBranches(false);
    });
    const unsubscribeAdminBranches = subscribeToBranches((updatedBranches) => {
        setAvailableBranches(updatedBranches);
        setIsLoadingBranches(false);
    });

    if (!propBulkMeters || propBulkMeters.length === 0) {
      initializeBulkMeters().then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ customerKeyNumber: bm.customerKeyNumber, name: bm.name }));
        setDynamicBulkMeters(fetchedBms);
      });
    } else {
         setDynamicBulkMeters(propBulkMeters);
    }

    let unsubscribeBMs = () => {};
    if (!propBulkMeters || propBulkMeters.length === 0) {
      unsubscribeBMs = subscribeToBulkMeters((updatedBulkMeters) => {
        setDynamicBulkMeters(updatedBulkMeters.map(bm => ({ customerKeyNumber: bm.customerKeyNumber, name: bm.name })));
      });
    }
    return () => {
      unsubscribeAdminBranches();
      unsubscribeBMs();
    }
  }, [propBulkMeters, open]);

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        customerKeyNumber: defaultValues.customerKeyNumber || "",
        contractNumber: defaultValues.contractNumber || "",
        customerType: defaultValues.customerType || undefined,
        bookNumber: defaultValues.bookNumber || "",
        ordinal: defaultValues.ordinal ?? undefined,
        meterSize: defaultValues.meterSize ?? undefined,
        meterNumber: defaultValues.meterNumber || "",
        previousReading: defaultValues.previousReading ?? undefined,
        currentReading: defaultValues.currentReading ?? undefined,
        month: defaultValues.month || "",
        specificArea: defaultValues.specificArea || "",
        location: defaultValues.location || "",
        ward: defaultValues.ward || "",
        sewerageConnection: defaultValues.sewerageConnection || undefined,
        assignedBulkMeterId: defaultValues.assignedBulkMeterId || UNASSIGNED_BULK_METER_VALUE,
        branchId: defaultValues.branchId || undefined,
        status: defaultValues.status || "Active",
        paymentStatus: defaultValues.paymentStatus || "Unpaid",
        arrears: defaultValues.arrears ?? 0,
      });
    } else {
      form.reset({
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
        location: staffBranchName || "",
        ward: "",
        sewerageConnection: undefined,
        assignedBulkMeterId: UNASSIGNED_BULK_METER_VALUE, 
        branchId: undefined,
        status: "Active",
        paymentStatus: "Unpaid",
        arrears: 0,
      });
    }
  }, [defaultValues, form, open, staffBranchName]);

  const handleSubmit = (data: IndividualCustomerFormValues) => {
    const submissionData = {
        ...data,
        assignedBulkMeterId: data.assignedBulkMeterId === UNASSIGNED_BULK_METER_VALUE ? undefined : data.assignedBulkMeterId,
        branchId: data.branchId === BRANCH_UNASSIGNED_VALUE ? undefined : data.branchId,
    };
    onSubmit(submissionData);
    onOpenChange(false);
  };

  const handleBulkMeterChange = (value: string | undefined) => {
    form.setValue("assignedBulkMeterId", value);
  };

  const handleBranchChange = (branchIdValue: string) => {
    const selectedBranch = availableBranches.find(b => b.id === branchIdValue);
    if (selectedBranch) {
      form.setValue("branchId", selectedBranch.id);
    } else if (branchIdValue === BRANCH_UNASSIGNED_VALUE) {
      form.setValue("branchId", undefined);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of the customer." : "Fill in the details to add a new customer."}
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
                        <FormLabel>Assign to Branch</FormLabel>
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
                            <SelectItem value={BRANCH_UNASSIGNED_VALUE}>None</SelectItem>
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
                name="assignedBulkMeterId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Assign to Bulk Meter</FormLabel>
                    <Select
                        onValueChange={handleBulkMeterChange}
                        value={field.value} 
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value={UNASSIGNED_BULK_METER_VALUE}>None</SelectItem>
                        {dynamicBulkMeters.length === 0 && (
                            <SelectItem value="no-bms-available" disabled>
                            No bulk meters available
                            </SelectItem>
                        )}
                        {dynamicBulkMeters.map((bm) => (
                            <SelectItem key={bm.customerKeyNumber} value={bm.customerKeyNumber}>
                            {bm.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="customerKeyNumber" render={({ field }) => (<FormItem><FormLabel>Cust. Key No. *</FormLabel><FormControl><Input {...field} disabled={!!defaultValues} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contractNumber" render={({ field }) => (<FormItem><FormLabel>Contract No. *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{customerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bookNumber" render={({ field }) => (<FormItem><FormLabel>Book No. *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="ordinal" render={({ field }) => (<FormItem><FormLabel>Ordinal *</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value,10))} /></FormControl><FormMessage /></FormItem>)} />
              
              <FormField 
                control={form.control} 
                name="meterSize" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter Size (inch) *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a size" />
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
              <FormField control={form.control} name="meterNumber" render={({ field }) => (<FormItem><FormLabel>Meter No. *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="previousReading" render={({ field }) => (<FormItem><FormLabel>Previous Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              
              <FormField control={form.control} name="currentReading" render={({ field }) => (<FormItem><FormLabel>Current Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="month" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Reading Month *</FormLabel><DatePicker date={field.value && isValid(parse(field.value, 'yyyy-MM', new Date())) ? parse(field.value, 'yyyy-MM', new Date()) : undefined} setDate={(date) => field.onChange(date ? format(date, "yyyy-MM") : "")} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="specificArea" render={({ field }) => (<FormItem><FormLabel>Specific Area *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-City *</FormLabel>
                       <Select 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          disabled={form.formState.isSubmitting}
                        >
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
                       <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}>
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

              <FormField control={form.control} name="sewerageConnection" render={({ field }) => (<FormItem><FormLabel>Sewerage Conn. *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger></FormControl><SelectContent>{sewerageConnections.map(conn => <SelectItem key={conn} value={conn}>{conn}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Customer Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger></FormControl><SelectContent>{individualCustomerStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => (<FormItem><FormLabel>Payment Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select payment status"/></SelectTrigger></FormControl><SelectContent>{paymentStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="arrears" render={({ field }) => (<FormItem><FormLabel>Outstanding Bill (ETB)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {defaultValues ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
