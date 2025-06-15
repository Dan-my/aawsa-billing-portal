
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters."),
  // maxConsumption is string to handle "Infinity" or numeric values
  maxConsumption: z.string().refine(value => value === "Infinity" || !isNaN(parseFloat(value)) && parseFloat(value) >= 0, {
    message: "Max Consumption must be a non-negative number or 'Infinity'.",
  }),
  rate: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) >= 0, {
    message: "Rate must be a non-negative number.",
  }),
});

export type TariffFormValues = z.infer<typeof formSchema>;

interface TariffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TariffFormValues) => void;
  defaultValues?: TariffFormValues | null;
  currency?: string;
}

export function TariffFormDialog({ open, onOpenChange, onSubmit, defaultValues, currency = "ETB" }: TariffFormDialogProps) {
  const form = useForm<TariffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      description: "",
      maxConsumption: "",
      rate: "",
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({
        description: "",
        maxConsumption: "",
        rate: "",
      });
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (data: TariffFormValues) => {
    onSubmit(data);
    onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Tariff Tier" : "Add New Tariff Tier"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of this tariff tier." : "Define a new progressive tariff tier."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., First 5 m³ consumption, or High consumption tier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxConsumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Consumption in Tier (m³)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 5 or 50 or 'Infinity' for the last tier" {...field} />
                  </FormControl>
                   <FormMessage />
                   <p className="text-xs text-muted-foreground">
                    Enter a number (e.g., 5.00) or 'Infinity' for the highest tier.
                   </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate ({currency}/m³)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 10.21" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {defaultValues ? "Save Changes" : "Add Tier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
