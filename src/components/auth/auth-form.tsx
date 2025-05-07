
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type UserRole = "admin" | "staff";

interface User {
  email: string;
  role: UserRole;
  branchName?: string; // Added for staff
}

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { email, password } = values;

    if (password === "password") { // Dummy password check
      let user: User | null = null;
      let redirectTo = "";

      if (email === "admin@aawsa.com") {
        user = { email, role: "admin" };
        redirectTo = "/admin/dashboard";
      } else if (email.endsWith("@aawsa.com") && email !== "admin@aawsa.com") {
        // Staff login based on branch name convention: [branchname]@aawsa.com
        const emailParts = email.split("@");
        const branchIdentifier = emailParts[0];
        
        // Convert identifier to a displayable branch name (e.g., "kality" -> "Kality Branch")
        // This is a simple conversion; a real app might look up branch details.
        const branchName = branchIdentifier.charAt(0).toUpperCase() + branchIdentifier.slice(1) + " Branch";
        
        user = { email, role: "staff", branchName };
        redirectTo = "/staff/dashboard";
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        toast({
          title: "Login Successful",
          description: `Welcome, ${user.role === 'admin' ? user.email : user.branchName}! Redirecting...`,
        });
        window.location.assign(redirectTo); // Use assign for full page reload to ensure middleware/layout effects
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Use 'admin@aawsa.com' or '[branchname]@aawsa.com' (e.g. kality@aawsa.com) with password 'password'.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Use 'admin@aawsa.com' or '[branchname]@aawsa.com' (e.g. kality@aawsa.com) with password 'password'.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Droplets className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">AAWSA Billing Portal</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., admin@aawsa.com or kality@aawsa.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Use admin@aawsa.com or [branchname]@aawsa.com (e.g. kality@aawsa.com) with password 'password'.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
