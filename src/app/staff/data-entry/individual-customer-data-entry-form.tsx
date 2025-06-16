
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { baseIndividualCustomerDataSchema } from "@/app/admin/data-entry/customer-data-entry-types"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers } from "@/lib/data-store";
import type { IndividualCustomer, IndividualCustomerStatus } from "@/app/admin/individual-customers/individual-customer-types";
import { individualCustomerStatuses } from "@/app/admin/individual-customers/individual-customer-types";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";
import { customerTypes, sewerageConnections, paymentStatuses, type PaymentStatus, type CustomerType, type SewerageConnection } from "@/lib/billing";


interface StaffIndividualCustomerEntryFormProps {
  branchName: string; 
}

// Schema for the form, extending baseIndividualCustomerDataSchema with status and paymentStatus
const StaffEntryFormSchema = baseIndividualCustomerDataSchema.extend({
  status: z.enum(individualCustomerStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  paymentStatus: z.enum(paymentStatuses, { errorMap: () => ({ message: "Please select a valid payment status."}) }),
});
type StaffEntryFormValues = z.infer<typeof StaffEntryFormSchema>;

const UNASSIGNED_BULK_METER_VALUE = "_SELECT_NONE_BULK_METER_";

export function StaffIndividualCustomerEntryForm({ branchName }: StaffIndividualCustomerEntryFormProps) {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isLoadingBulkMeters, setIsLoadingBulkMeters] = React.useState(true);

  const form = useForm<StaffEntryFormValues>({ 
    resolver: zodResolver(StaffEntryFormSchema), 
    defaultValues: {
      assignedBulkMeterId: UNASSIGNED_BULK_METER_VALUE,
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

  const assignedBulkMeterIdValue = form.watch("assignedBulkMeterId");
  const actualBulkMeterIsSelected = assignedBulkMeterIdValue !== UNASSIGNED_BULK_METER_VALUE && !!assignedBulkMeterIdValue;

  React.useEffect(() => {
    setIsLoadingBulkMeters(true);
    Promise.all([
        initializeBulkMeters(),
        initializeCustomers() // Though not directly used in this form's state, good to ensure it's ready
    ]).then(() => {
        const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
        setAvailableBulkMeters(fetchedBms);
        setIsLoadingBulkMeters(false);
    });

    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
      // If the currently selected bulk meter is no longer available, reset selection
      if (assignedBulkMeterIdValue && !newBms.find(bm => bm.id === assignedBulkMeterIdValue)) {
        form.setValue("assignedBulkMeterId", UNASSIGNED_BULK_METER_VALUE);
      }
      setIsLoadingBulkMeters(false); 
    });
    return () => unsubscribe();
  }, [assignedBulkMeterIdValue, form]);

  async function onSubmit(data: StaffEntryFormValues) { 
    const submissionData = {
      ...data,
      assignedBulkMeterId: data.assignedBulkMeterId === UNASSIGNED_BULK_METER_VALUE ? undefined : data.assignedBulkMeterId,
    };
    
    const result = await addCustomerToStore(submissionData as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'calculatedBill'>);
    if (result.success && result.data) {
        toast({
        title: "Data Entry Submitted",
        description: `Data for individual customer ${result.data.name} (Branch: ${branchName}) has been successfully recorded.`,
        });
        form.reset(); // This will also reset assignedBulkMeterId to UNASSIGNED_BULK_METER_VALUE
    } else {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: result.message || "Could not record customer data. Please check console for errors.",
        });
    }
  }
  
  const handleBulkMeterChange = (value: string | undefined) => {
    form.setValue("assignedBulkMeterId", value);
  };

  const commonFieldDisabled = !actualBulkMeterIsSelected || form.formState.isSubmitting || isLoadingBulkMeters;
  const submitButtonDisabled = !actualBulkMeterIsSelected || form.formState.isSubmitting || isLoadingBulkMeters;


  return (
    <ScrollArea className="h-[calc(100vh-380px)]"> 
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
           <FormField
              control={form.control}
              name="assignedBulkMeterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Bulk Meter *</FormLabel>
                  <Select
                    onValueChange={handleBulkMeterChange} // Use explicit handler
                    value={field.value || UNASSIGNED_BULK_METER_VALUE}
                    disabled={isLoadingBulkMeters || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBulkMeters ? "Loading bulk meters..." : "Select a bulk meter"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_BULK_METER_VALUE}>None</SelectItem>
                      {availableBulkMeters.length === 0 && !isLoadingBulkMeters && (
                        <SelectItem value="no-bms-available-staff" disabled>
                          No bulk meters available for your branch
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
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customerKeyNumber" render={({ field }) => (<FormItem><FormLabel>Cust. Key No. *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contractNumber" render={({ field }) => (<FormItem><FormLabel>Contract No. *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={commonFieldDisabled}><FormControl><SelectTrigger disabled={commonFieldDisabled}><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{customerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="bookNumber" render={({ field }) => (<FormItem><FormLabel>Book No. *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="ordinal" render={({ field }) => (<FormItem><FormLabel>Ordinal *</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value,10))} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="meterSize" render={({ field }) => (<FormItem><FormLabel>Meter Size (inch) *</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="meterNumber" render={({ field }) => (<FormItem><FormLabel>Meter No. *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="previousReading" render={({ field }) => (<FormItem><FormLabel>Previous Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="currentReading" render={({ field }) => (<FormItem><FormLabel>Current Reading *</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="month" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Reading Month *</FormLabel><DatePicker date={field.value && isValid(parse(field.value, "yyyy-MM", new Date())) ? parse(field.value, "yyyy-MM", new Date()) : undefined} setDate={(date) => field.onChange(date ? format(date, "yyyy-MM") : "")} disabledTrigger={commonFieldDisabled} /><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="specificArea" render={({ field }) => (<FormItem><FormLabel>Specific Area *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Sub-City *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="ward" render={({ field }) => (<FormItem><FormLabel>Ward / Woreda *</FormLabel><FormControl><Input {...field} disabled={commonFieldDisabled} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="sewerageConnection" render={({ field }) => (<FormItem><FormLabel>Sewerage Conn. *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={commonFieldDisabled}><FormControl><SelectTrigger disabled={commonFieldDisabled}><SelectValue placeholder="Select connection" /></SelectTrigger></FormControl><SelectContent>{sewerageConnections.map(conn => <SelectItem key={conn} value={conn}>{conn}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Customer Status *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={commonFieldDisabled}><FormControl><SelectTrigger disabled={commonFieldDisabled}><SelectValue placeholder="Select status"/></SelectTrigger></FormControl><SelectContent>{individualCustomerStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="paymentStatus" render={({ field }) => (<FormItem><FormLabel>Payment Status *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={commonFieldDisabled}><FormControl><SelectTrigger disabled={commonFieldDisabled}><SelectValue placeholder="Select payment status"/></SelectTrigger></FormControl><SelectContent>{paymentStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
           </div>

          <Button type="submit" className="w-full md:w-auto" disabled={submitButtonDisabled}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Individual Customer Data"}
          </Button>
        </form>
      </Form>
    </ScrollArea>
  );
}


    