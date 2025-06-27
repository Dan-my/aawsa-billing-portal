
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    // Step 1: Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
    });

    if (authData.session) {
        // Successful login, the AppShell listener will handle redirection
        toast({
            title: "Login Successful",
            description: "Welcome back! Redirecting...",
        });
        setIsLoading(false);
        return;
    }

    // Step 2: If auth fails, provide more specific feedback
    if (authError) {
        // Check if a profile exists in the staff_members table
        const { data: staffProfile } = await supabase
            .from('staff_members')
            .select('*')
            .eq('email', values.email)
            .single();

        if (staffProfile) {
            // A profile exists, so the password was likely wrong or the account is out of sync.
            if (staffProfile.status !== 'Active') {
                toast({
                    variant: "destructive",
                    title: "Account Not Active",
                    description: `This account's status is '${staffProfile.status}'. Please contact an administrator.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Password Incorrect",
                    description: "The password for this account is incorrect. If you believe this is an error, please contact an administrator to sync your account.",
                });
            }
        } else {
            // No profile was found for this email
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "User not found. Please check your email and password.",
            });
        }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AAWSA Billing Portal</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., kality@aawsa.com"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : <> <LogIn className="mr-2 h-4 w-4"/> Sign In </>}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Contact your administrator if you have trouble logging in.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
