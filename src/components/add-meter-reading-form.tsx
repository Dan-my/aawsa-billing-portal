
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as z from "zod";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";

const formSchema = z.object({
  meterType: z.enum(['individual_customer_meter', 'bulk_meter'], {
    required_error: "Please select a meter type.",
  }),
  entityId: z.string().min(1, "Please select a meter."),
  reading: z.coerce.number().min(0, "Reading must be a non-negative number"),
  date: z.date({
    required_error: "A date is required.",
  }),
});

export type AddMeterReadingFormValues = z.infer<typeof formSchema>;

interface AddMeterReadingFormProps {
  onSubmit: (values: AddMeterReadingFormValues) => void;
  customers: Pick<IndividualCustomer, 'id' | 'name' | 'meterNumber'>[];
  bulkMeters: Pick<BulkMeter, 'id' | 'name' | 'meterNumber'>[];
  isLoading?: boolean;
}

export function AddMeterReadingForm({ onSubmit, customers, bulkMeters, isLoading }: AddMeterReadingFormProps) {
  const form = useForm<AddMeterReadingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meterType: undefined,
      entityId: "",
      reading: 0,
      date: new Date(),
    }
  });

  const selectedMeterType = form.watch("meterType");

  const availableMeters = React.useMemo(() => {
    if (selectedMeterType === 'individual_customer_meter') {
      return customers.map(c => ({
        value: c.id,
        label: `${c.name} (Meter: ${c.meterNumber})`,
      }));
    }
    if (selectedMeterType === 'bulk_meter') {
      return bulkMeters.map(bm => ({
        value: bm.id,
        label: `${bm.name} (Meter: ${bm.meterNumber})`,
      }));
    }
    return [];
  }, [selectedMeterType, customers, bulkMeters]);

  function handleSubmit(values: AddMeterReadingFormValues) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="meterType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meter Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meter type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="individual_customer_meter">Individual Customer Meter</SelectItem>
                  <SelectItem value="bulk_meter">Bulk Meter</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMeterType && (
          <FormField
            control={form.control}
            name="entityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Meter</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || availableMeters.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={availableMeters.length === 0 ? "No meters available for type" : "Select a meter"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableMeters.map((meter) => (
                      <SelectItem key={meter.value} value={meter.value}>
                        {meter.label}
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
          name="reading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reading Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter reading value"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Reading</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2000-01-01") 
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !form.formState.isValid}>
          {isLoading ? "Submitting..." : "Add Reading"}
        </Button>
      </form>
    </Form>
  );
}
