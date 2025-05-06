"use client";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    let roleToSet: string | null = null;
    let redirectTo: string | null = null;
    let toastMessage: string | null = null;

    if (values.email === "admin@aawsa.com" && values.password === "password") {
      roleToSet = "admin";
      redirectTo = "/admin/dashboard";
      toastMessage = "Welcome, Admin!";
    } else if (values.email === "staff@aawsa.com" && values.password === "password") {
      roleToSet = "staff";
      redirectTo = "/staff/dashboard";
      toastMessage = "Welcome, Staff!";
    }

    if (roleToSet && redirectTo && toastMessage) {
      // Set localStorage for client-side checks
      localStorage.setItem("userRole", roleToSet);
      // Set cookie for middleware and server-side checks
      document.cookie = `userRole=${roleToSet}; path=/; max-age=${60 * 60 * 24 * 7}`; // Max age 7 days
      toast({
        title: "Login Successful",
        description: toastMessage,
      });
      router.push(redirectTo);
      router.refresh(); // Ensure the page refreshes and middleware re-evaluates
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password.",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 mx-auto text-primary mb-4">
            <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 3a.75.75 0 0 1 .75.75v2.518a4.505 4.505 0 0 1 2.043 1.101l1.795-1.795a.75.75 0 1 1 1.06 1.06l-1.795 1.795a4.504 4.504 0 0 1 1.101 2.043h2.518a.75.75 0 0 1 0 1.5h-2.518a4.504 4.504 0 0 1-1.101 2.043l1.795 1.795a.75.75 0 1 1-1.06 1.06l-1.795-1.795a4.505 4.505 0 0 1-2.043 1.101v2.518a.75.75 0 0 1-1.5 0v-2.518a4.505 4.505 0 0 1-2.043-1.101l-1.795 1.795a.75.75 0 1 1-1.06-1.06l1.795-1.795a4.504 4.504 0 0 1-1.101-2.043H5.25a.75.75 0 0 1 0-1.5h2.518a4.504 4.504 0 0 1 1.101-2.043L7.074 7.073a.75.75 0 1 1 1.06-1.06l1.795 1.795A4.505 4.505 0 0 1 11.25 6.718V4.2a.75.75 0 0 1 .75-.75Zm0 3.926A2.25 2.25 0 1 0 12 12.426a2.25 2.25 0 0 0 0-4.5Z" />
          </svg>
          <CardTitle className="text-3xl font-bold">AAWSA Billing Portal</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
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
                      <Input placeholder="user@example.com" {...field} />
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
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
