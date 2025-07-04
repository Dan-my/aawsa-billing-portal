
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
import type { StaffMember, StaffStatus } from "./staff-types";
import { getBranches, initializeBranches, subscribeToBranches } from "@/lib/data-store";
import type { Branch } from "@/app/admin/branches/branch-types";

const staffStatuses: StaffStatus[] = ['Active', 'Inactive', 'On Leave'];
const staffRoles = ['Admin', 'Staff'] as const;

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  branch: z.string().min(1, { message: "Branch is required." }),
  status: z.enum(staffStatuses, { errorMap: () => ({ message: "Please select a valid status."}) }),
  phone: z.string().optional(),
  role: z.enum(staffRoles, { required_error: "Role is required." }),
}).refine(data => {
    return true;
});


export type StaffFormValues = z.infer<typeof formSchema>;

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StaffFormValues) => void;
  defaultValues?: StaffMember | null;
}

export function StaffFormDialog({ open, onOpenChange, onSubmit, defaultValues }: StaffFormDialogProps) {
  const [availableBranches, setAvailableBranches] = React.useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setIsLoadingBranches(true);
      initializeBranches().then(() => {
        setAvailableBranches(getBranches());
        setIsLoadingBranches(false);
      });
      const unsubscribe = subscribeToBranches((updatedBranches) => {
        setAvailableBranches(updatedBranches);
      });
      return () => unsubscribe();
    }
  }, [open]);
  
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      branch: "",
      status: undefined,
      phone: "",
      role: undefined,
    },
  });
  
  const isEditing = !!defaultValues;

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        email: defaultValues.email,
        password: "", // Always clear password field for security
        branch: defaultValues.branch,
        status: defaultValues.status,
        phone: defaultValues.phone || "",
        role: defaultValues.role,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        password: "",
        branch: "",
        status: "Active",
        phone: "",
        role: "Staff",
      });
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (data: StaffFormValues) => {
    // For new users, ensure a password is provided
    if (!isEditing && !data.password) {
        form.setError("password", { type: "manual", message: "Password is required for new staff members." });
        return;
    }
    onSubmit(data);
    onOpenChange(false); 
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of the staff member." : "Fill in the details to add a new staff member."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Login ID)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., kality@aawsa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? "New Password (Optional)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEditing ? "Leave blank to keep current" : "••••••••"} {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., +251 91 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isLoadingBranches}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select a branch"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add Role Select Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {defaultValues ? "Save Changes" : "Add Staff"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
