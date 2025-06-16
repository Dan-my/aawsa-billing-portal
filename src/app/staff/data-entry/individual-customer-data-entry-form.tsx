
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
} from "@/app/admin/data-entry/customer-data-entry-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers, getCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";
import { customerTypes, sewerageConnections } from "@/lib/billing";

interface StaffIndividualCustomerEntryFormProps {
  branchName: string;
}

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isLoadingBulkMeters, setIsLoadingBulkMeters] = React.useState(true);

  React.useEffect(() => {
    setIsLoadingBulkMeters(true);
    Promise.all([
        initializeBulkMeters(),
        initializeCustomers()
    ]).then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setAvailableBulkMeters(fetchedBms);
        setIsLoadingBulkMeters(false);
    });

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
      setIsLoadingBulkMeters(false);
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
      location: "",
      ward: "",
      sewerageConnection: undefined,
      assignedBulkMeterId: undefined,
    },
  });

  async function onSubmit(data: IndividualCustomerDataEntryFormValues) {
    const customerDataForStore = data as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'>;

    const result = await addCustomerToStore(customerDataForStore);
    if (result.success && result.data) {
      toast({
        title: "Individual Customer Data Submitted",
        description: `Data for customer ${result.data.name} (Branch: ${branchName}) has been recorded.`,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.message || "Could not record customer data.",
      });
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-380px)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Customer Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customerKeyNumber" render={({ field }) => (<FormItem><FormLabel>Customer Key Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contractNumber" render={({ field }) => (<FormItem><FormLabel>Contract Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{customerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="bookNumber" render={({ field }) => (<FormItem><FormLabel>Book Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="ordinal" render={({ field }) => (<FormItem><FormLabel>Ordinal *</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value,10))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="meterSize" render={({ field }) => (<FormItem><FormLabel>Meter Size (inch) *</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="meterNumber" render={({ field }) => (<FormItem><FormLabel>Meter Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="previousReading" render={({ field }) => (<FormItem><FormLabel>Previous Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="currentReading" render={({ field }) => (<FormItem><FormLabel>Current Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="month" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Reading Month *</FormLabel><DatePicker date={field.value ? parse(field.value, "yyyy-MM", new Date()) : undefined} setDate={(selectedDate) => field.onChange(selectedDate ? format(selectedDate, "yyyy-MM") : "")} /><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="specificArea" render={({ field }) => (<FormItem><FormLabel>Specific Area *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Sub-City *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="ward" render={({ field }) => (<FormItem><FormLabel>Ward / Woreda *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="sewerageConnection" render={({ field }) => (<FormItem><FormLabel>Sewerage Connection *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger></FormControl><SelectContent>{sewerageConnections.map(conn => <SelectItem key={conn} value={conn}>{conn}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="assignedBulkMeterId" render={({ field }) => (<FormItem><FormLabel>Assign to Bulk Meter</FormLabel><Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingBulkMeters}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingBulkMeters ? "Loading..." : "Select bulk meter"} /></SelectTrigger></FormControl><SelectContent>{isLoadingBulkMeters && <SelectItem value="loading-bms" disabled>Loading...</SelectItem>}{!isLoadingBulkMeters && availableBulkMeters.length === 0 && <SelectItem value="no-bms-staff" disabled>No bulk meters available</SelectItem>}{!isLoadingBulkMeters && availableBulkMeters.length > 0 && <SelectItem value="">None</SelectItem>}{availableBulkMeters.map((bm) => (<SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Individual Customer Data"}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  );
}
