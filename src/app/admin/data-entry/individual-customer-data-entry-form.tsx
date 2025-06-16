
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
import { baseIndividualCustomerDataSchema } from "./customer-data-entry-types"; 

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers } from "@/lib/data-store";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";
import { customerTypes, sewerageConnections, paymentStatuses } from "@/lib/billing";
import { individualCustomerStatuses } from "../individual-customers/individual-customer-types";
import type * as z from "zod";

// Use the same schema as the dialog for consistency, which includes status and paymentStatus
const FormSchemaForAdminDataEntry = baseIndividualCustomerDataSchema.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  paymentStatus: z.enum(paymentStatuses, { errorMap: () => ({ message: "Please select a valid payment status."}) }),
});
type AdminDataEntryFormValues = z.infer<typeof FormSchemaForAdminDataEntry>;


const UNASSIGNED_BULK_METER_VALUE = "_SELECT_NONE_BULK_METER_";

export function IndividualCustomerDataEntryForm() {
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

  const form = useForm<AdminDataEntryFormValues>({ 
    resolver: zodResolver(FormSchemaForAdminDataEntry), 
    defaultValues: {
      assignedBulkMeterId: undefined,
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
      status: "Active", 
      paymentStatus: "Unpaid", 
    },
  });

  async function onSubmit(data: AdminDataEntryFormValues) {
    const submissionData = {
      ...data,
      assignedBulkMeterId: data.assignedBulkMeterId === UNASSIGNED_BULK_METER_VALUE ? undefined : data.assignedBulkMeterId,
    };
    
    const result = await addCustomerToStore(submissionData as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'calculatedBill'>);
    if (result.success && result.data) {
        toast({
        title: "Data Entry Submitted",
        description: `Data for individual customer ${result.data.name} has been successfully recorded.`,
        });
        form.reset();
    } else {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: result.message || "Could not record customer data. Please check console for errors.",
        });
    }
  }
  
  const handleBulkMeterChange = (value: string | undefined) => {
    const actualValue = value === UNASSIGNED_BULK_METER_VALUE ? undefined : value;
    form.setValue("assignedBulkMeterId", actualValue);
  };


  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <Card className="shadow-lg w-full">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                  control={form.control}
                  name="assignedBulkMeterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Bulk Meter *</FormLabel>
                      <Select
                        onValueChange={handleBulkMeterChange}
                        value={field.value || UNASSIGNED_BULK_METER_VALUE}
                        disabled={isLoadingBulkMeters || form.formState.isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingBulkMeters ? "Loading..." : "Select bulk meter"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_BULK_METER_VALUE}>None</SelectItem>
                          {availableBulkMeters.length === 0 && !isLoadingBulkMeters && (
                            <SelectItem value="no-bms-available" disabled>
                              No bulk meters available
                            </SelectItem>
                          )}
                          {availableBulkMeters.map((bm) => (
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
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="customerKeyNumber" render={({ field }) => (<FormItem><FormLabel>Cust. Key No. *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contractNumber" render={({ field }) => (<FormItem><FormLabel>Contract No. *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{customerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bookNumber" render={({ field }) => (<FormItem><FormLabel>Book No. *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="ordinal" render={({ field }) => (<FormItem><FormLabel>Ordinal *</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value,10))} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField control={form.control} name="meterSize" render={({ field }) => (<FormItem><FormLabel>Meter Size (inch) *</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="meterNumber" render={({ field }) => (<FormItem><FormLabel>Meter No. *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="previousReading" render={({ field }) => (<FormItem><FormLabel>Previous Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField control={form.control} name="currentReading" render={({ field }) => (<FormItem><FormLabel>Current Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="month" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Reading Month *</FormLabel><DatePicker date={field.value && isValid(parse(field.value, "yyyy-MM", new Date())) ? parse(field.value, "yyyy-MM", new Date()) : undefined} setDate={(date) => field.onChange(date ? format(date, "yyyy-MM") : "")} disabledTrigger={form.formState.isSubmitting} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="specificArea" render={({ field }) => (<FormItem><FormLabel>Specific Area *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Sub-City *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="ward" render={({ field }) => (<FormItem><FormLabel>Ward / Woreda *</FormLabel><FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sewerageConnection" render={({ field }) => (<FormItem><FormLabel>Sewerage Conn. *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger></FormControl><SelectContent>{sewerageConnections.map(conn => <SelectItem key={conn} value={conn}>{conn}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Customer Status *</FormLabel><Select onValueChange={field.onChange} value={field.value || "Active"} defaultValue={field.value || "Active"} disabled={form.formState.isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger></FormControl><SelectContent>{individualCustomerStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="paymentStatus" render={({ field }) => (<FormItem><FormLabel>Payment Status *</FormLabel><Select onValueChange={field.onChange} value={field.value || "Unpaid"} defaultValue={field.value || "Unpaid"} disabled={form.formState.isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select payment status"/></SelectTrigger></FormControl><SelectContent>{paymentStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
               </div>


              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit Individual Customer"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
