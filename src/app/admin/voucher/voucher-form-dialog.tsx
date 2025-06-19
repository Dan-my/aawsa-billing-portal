
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
import { DatePicker } from "@/components/ui/date-picker"; // Ensure you have this component
import { Textarea } from "@/components/ui/textarea";
import type { Voucher, VoucherStatus, VoucherDiscountType } from "./voucher-types";
import { format, parseISO, isValid } from "date-fns";

const voucherStatuses: VoucherStatus[] = ['Active', 'Used', 'Expired', 'Cancelled'];
const voucherDiscountTypes: VoucherDiscountType[] = ['percentage', 'fixed_amount'];

const formSchema = z.object({
  code: z.string().min(3, { message: "Voucher code must be at least 3 characters." }).max(50),
  discountType: z.enum(voucherDiscountTypes, { errorMap: () => ({ message: "Please select a valid discount type."}) }),
  discountValue: z.coerce.number().min(0, { message: "Discount value must be non-negative." }),
  expiryDate: z.date().optional().nullable(),
  status: z.enum(voucherStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  maxUses: z.coerce.number().int().min(0).optional().nullable().transform(val => val === 0 ? null : val), // 0 means unlimited if null
  notes: z.string().max(255).optional().nullable(),
}).refine(data => {
    if (data.discountType === 'percentage' && (data.discountValue < 0 || data.discountValue > 100)) {
        return false;
    }
    return true;
}, {
    message: "Percentage discount must be between 0 and 100.",
    path: ["discountValue"],
});


export type VoucherFormValues = z.infer<typeof formSchema>;

interface VoucherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VoucherFormValues) => void;
  defaultValues?: Voucher | null;
}

export function VoucherFormDialog({ open, onOpenChange, onSubmit, defaultValues }: VoucherFormDialogProps) {
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      discountType: "fixed_amount",
      discountValue: 0,
      expiryDate: null,
      status: "Active",
      maxUses: null, // null or undefined will be treated as infinity by the table
      notes: "",
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        code: defaultValues.code,
        discountType: defaultValues.discountType,
        discountValue: defaultValues.discountValue,
        expiryDate: defaultValues.expiryDate && isValid(parseISO(defaultValues.expiryDate)) ? parseISO(defaultValues.expiryDate) : null,
        status: defaultValues.status,
        maxUses: defaultValues.maxUses === null ? null : (defaultValues.maxUses ?? null),
        notes: defaultValues.notes || "",
      });
    } else {
      form.reset({
        code: "",
        discountType: "fixed_amount",
        discountValue: 0,
        expiryDate: null,
        status: "Active",
        maxUses: null,
        notes: "",
      });
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (data: VoucherFormValues) => {
    onSubmit(data);
    onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Voucher" : "Add New Voucher"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of the voucher." : "Fill in the details to create a new voucher."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SUMMER2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Discount Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {voucherDiscountTypes.map(type => (
                            <SelectItem key={type} value={type} className="capitalize">{type.replace('_', ' ')}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        Value {form.getValues("discountType") === 'percentage' ? '(%) *' : '(ETB) *'}
                    </FormLabel>
                    <FormControl>
                        <Input type="number" step={form.getValues("discountType") === 'percentage' ? "1" : "0.01"} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date (Optional)</FormLabel>
                  <DatePicker 
                    date={field.value || undefined} 
                    setDate={(date) => field.onChange(date || null)}
                    disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {voucherStatuses.map(status => (
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
                name="maxUses"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Max Uses (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" step="1" min="0" placeholder="0 for unlimited" {...field} 
                         value={field.value ?? ""}
                         onChange={e => field.onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any internal notes about this voucher..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {defaultValues ? "Save Changes" : "Create Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
