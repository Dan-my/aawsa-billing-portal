
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
  customerTypes,
  sewerageConnections,
} from "./customer-data-entry-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { addCustomer as addCustomerToStore, getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, initializeCustomers, getCustomers } from "@/lib/data-store";
import type { IndividualCustomer, CustomerType, SewerageConnection } from "../individual-customers/individual-customer-types"; 
import { initialBulkMeters as defaultInitialBulkMeters } from "../bulk-meters/page";
import { initialCustomers as defaultInitialCustomers } from "../individual-customers/page";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";


export function IndividualCustomerDataEntryForm() {
  const { toast } = useToast();
  const [availableBulkMeters, setAvailableBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [isBulkMeterSelected, setIsBulkMeterSelected] = React.useState(false);

  React.useEffect(() => {
    if (getBulkMeters().length === 0) initializeBulkMeters(defaultInitialBulkMeters);
    if (getCustomers().length === 0) initializeCustomers(defaultInitialCustomers);
    
    const fetchedBms = getBulkMeters().map(bm => ({ id: bm.id, name: bm.name }));
    setAvailableBulkMeters(fetchedBms);
    
    // Check if a bulk meter is already selected (e.g. from form state persistence or default values)
    const currentAssignedBulkMeterId = form.getValues("assignedBulkMeterId");
    if (fetchedBms.length > 0 && currentAssignedBulkMeterId) {
        setIsBulkMeterSelected(true);
    } else if (fetchedBms.length === 0) {
        setIsBulkMeterSelected(false); // Ensure fields are disabled if no BMs
    }


    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      const newBms = updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name }));
      setAvailableBulkMeters(newBms);
       if (newBms.length === 0) { // If BMs become empty, disable fields
        setIsBulkMeterSelected(false);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // form dependency removed to avoid re-running fetch on every form change

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

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "assignedBulkMeterId") {
        setIsBulkMeterSelected(!!value.assignedBulkMeterId && availableBulkMeters.length > 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, availableBulkMeters]);


  function onSubmit(data: IndividualCustomerDataEntryFormValues) {
    const customerDataForStore = {
        ...data,
    } as Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection };
    
    addCustomerToStore(customerDataForStore);
    toast({
      title: "Data Entry Submitted",
      description: `Data for individual customer ${data.name} has been successfully recorded.`,
    });
    form.reset(); 
    setIsBulkMeterSelected(false);
  }
  
  const commonFormFieldProps = {
    disabled: !isBulkMeterSelected,
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
                  name="assignedBulkMeterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Bulk Meter *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setIsBulkMeterSelected(!!value && availableBulkMeters.length > 0);
                        }} 
                        value={field.value || ""} 
                        defaultValue={field.value || ""}
                       >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a bulk meter first" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {availableBulkMeters.length === 0 && <SelectItem value="no-bms" disabled>No bulk meters available</SelectItem>}
                          {availableBulkMeters.map((bm) => (
                            <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
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
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} {...commonFormFieldProps} />
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
                        <Input {...field} {...commonFormFieldProps}/>
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
                        <Input {...field} {...commonFormFieldProps}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Type *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""} 
                        defaultValue={field.value || ""}
                        disabled={!isBulkMeterSelected}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer type"/>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Number *</FormLabel>
                      <FormControl>
                        <Input {...field} {...commonFormFieldProps}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ordinal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordinal *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ""}
                          onChange={e => {
                            const val = e.target.value;
                            field.onChange(val === "" ? undefined : parseInt(val, 10));
                          }}
                          {...commonFormFieldProps}
                        />
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
                          {...commonFormFieldProps}
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
                        <Input {...field} {...commonFormFieldProps}/>
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
                          {...commonFormFieldProps}
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
                          {...commonFormFieldProps}
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
                        disabledTrigger={!isBulkMeterSelected}
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
                        <Input {...field} {...commonFormFieldProps}/>
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
                        <Input {...field} {...commonFormFieldProps}/>
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
                        <Input {...field} {...commonFormFieldProps}/>
                      </FormControl>
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""} 
                        defaultValue={field.value || ""}
                        disabled={!isBulkMeterSelected}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sewerage status"/>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sewerageConnections.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || !isBulkMeterSelected}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit Individual Customer Reading"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}

