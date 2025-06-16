
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
import { baseIndividualCustomerDataSchema } from "@/app/admin/data-entry/customer-data-entry-types";
import type { IndividualCustomer } from "./individual-customer-types";
import { individualCustomerStatuses } from "./individual-customer-types";
import { getBulkMeters, subscribeToBulkMeters, initializeBulkMeters } from "@/lib/data-store";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";
import { customerTypes, sewerageConnections, paymentStatuses } from "@/lib/billing";

// Schema for the form, extending the base data entry schema with status and paymentStatus
const individualCustomerFormObjectSchema = baseIndividualCustomerDataSchema.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  paymentStatus: z.enum(paymentStatuses, { errorMap: () => ({ message: "Please select a valid payment status."}) }),
});

export type IndividualCustomerFormValues = z.infer<typeof individualCustomerFormObjectSchema>;

interface IndividualCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IndividualCustomerFormValues) => void;
  defaultValues?: IndividualCustomer | null;
  bulkMeters?: { id: string; name: string }[]; // Optional, can be fetched if not provided
}

const UNASSIGNED_BULK_METER_VALUE = "_SELECT_NONE_BULK_METER_";

export function IndividualCustomerFormDialog({ open, onOpenChange, onSubmit, defaultValues, bulkMeters: propBulkMeters }: IndividualCustomerFormDialogProps) {
  const [dynamicBulkMeters, setDynamicBulkMeters] = React.useState<{ id: string; name: string }[]>(propBulkMeters || []);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(false);

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
      assignedBulkMeterId: undefined,
      status: "Active",
      paymentStatus: "Unpaid",
    },
  });

  React.useEffect(() => {
    if (!propBulkMeters || propBulkMeters.length === 0) {
      initializeBulkMeters().then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setDynamicBulkMeters(fetchedBms);
      });
    } else {
         setDynamicBulkMeters(propBulkMeters);
    }

    let unsubscribe = () => {};
    if (!propBulkMeters || propBulkMeters.length === 0) {
      unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
        setDynamicBulkMeters(updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
      });
    }
    return () => unsubscribe();
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
        assignedBulkMeterId: defaultValues.assignedBulkMeterId || undefined,
        status: defaultValues.status || "Active",
        paymentStatus: defaultValues.paymentStatus || "Unpaid",
      });
      setIsBulkMeterSelected(!!defaultValues.assignedBulkMeterId);
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
        location: "",
        ward: "",
        sewerageConnection: undefined,
        assignedBulkMeterId: undefined,
        status: "Active",
        paymentStatus: "Unpaid",
      });
      setIsBulkMeterSelected(false);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (data: IndividualCustomerFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const handleBulkMeterChange = (value: string | undefined) => {
    const actualValue = value === UNASSIGNED_BULK_METER_VALUE ? undefined : value;
    form.setValue("assignedBulkMeterId", actualValue);
    setIsBulkMeterSelected(!!actualValue);
  };
  
  const assignedBulkMeterIdValue = form.watch("assignedBulkMeterId");
  React.useEffect(() => {
    setIsBulkMeterSelected(!!assignedBulkMeterIdValue && assignedBulkMeterIdValue !== UNASSIGNED_BULK_METER_VALUE);
  }, [assignedBulkMeterIdValue]);


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
            <FormField
              control={form.control}
              name="assignedBulkMeterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Bulk Meter *</FormLabel>
                  <Select
                    onValueChange={handleBulkMeterChange}
                    value={field.value || UNASSIGNED_BULK_METER_VALUE} // Use UNASSIGNED_BULK_METER_VALUE if field.value is undefined
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bulk meter" />
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
                        <SelectItem key={bm.id} value={bm.id}>
                          {bm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="customerKeyNumber" render={({ field }) => (<FormItem><FormLabel>Cust. Key No. *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contractNumber" render={({ field }) => (<FormItem><FormLabel>Contract No. *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!isBulkMeterSelected}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{customerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bookNumber" render={({ field }) => (<FormItem><FormLabel>Book No. *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="ordinal" render={({ field }) => (<FormItem><FormLabel>Ordinal *</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value,10))} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="meterSize" render={({ field }) => (<FormItem><FormLabel>Meter Size (inch) *</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="meterNumber" render={({ field }) => (<FormItem><FormLabel>Meter No. *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="previousReading" render={({ field }) => (<FormItem><FormLabel>Previous Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="currentReading" render={({ field }) => (<FormItem><FormLabel>Current Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="month" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Reading Month *</FormLabel><DatePicker date={field.value && isValid(parse(field.value, "yyyy-MM", new Date())) ? parse(field.value, "yyyy-MM", new Date()) : undefined} setDate={(date) => field.onChange(date ? format(date, "yyyy-MM") : "")} disabledTrigger={!isBulkMeterSelected} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="specificArea" render={({ field }) => (<FormItem><FormLabel>Specific Area *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Sub-City *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="ward" render={({ field }) => (<FormItem><FormLabel>Ward / Woreda *</FormLabel><FormControl><Input {...field} disabled={!isBulkMeterSelected} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sewerageConnection" render={({ field }) => (<FormItem><FormLabel>Sewerage Conn. *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!isBulkMeterSelected}><FormControl><SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger></FormControl><SelectContent>{sewerageConnections.map(conn => <SelectItem key={conn} value={conn}>{conn}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Customer Status *</FormLabel><Select onValueChange={field.onChange} value={field.value || "Active"} defaultValue={field.value || "Active"} disabled={!isBulkMeterSelected}><FormControl><SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger></FormControl><SelectContent>{individualCustomerStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => (<FormItem><FormLabel>Payment Status *</FormLabel><Select onValueChange={field.onChange} value={field.value || "Unpaid"} defaultValue={field.value || "Unpaid"} disabled={!isBulkMeterSelected}><FormControl><SelectTrigger><SelectValue placeholder="Select payment status"/></SelectTrigger></FormControl><SelectContent>{paymentStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || !isBulkMeterSelected}>
                {defaultValues ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

