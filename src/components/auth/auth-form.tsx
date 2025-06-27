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

    // Query the staff_members table directly
    const { data: staffProfile, error: queryError } = await supabase
      .from('staff_members')
      .select('*')
      .eq('email', values.email)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows found, which is not a server error.
        toast({
            variant: "destructive",
            title: "Database Error",
            description: "Could not query user data. Please try again later.",
        });
        console.error("Supabase query error:", queryError);
        setIsLoading(false);
        return;
    }

    if (!staffProfile) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "User with this email not found.",
        });
        setIsLoading(false);
        return;
    }
    
    if (staffProfile.status !== 'Active') {
        toast({
            variant: "destructive",
            title: "Account Not Active",
            description: `This account's status is '${staffProfile.status}'. Please contact an administrator.`,
        });
        setIsLoading(false);
        return;
    }

    if (staffProfile.password !== values.password) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Incorrect password. Please try again.",
        });
        setIsLoading(false);
        return;
    }

    // --- Login Successful ---
    const userSessionData = {
        id: staffProfile.id,
        email: staffProfile.email,
        role: staffProfile.role.toLowerCase(), // Ensure role is lowercase
        branchName: staffProfile.branch,
        name: staffProfile.name,
    };

    localStorage.setItem('user', JSON.stringify(userSessionData));

    toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting...",
    });

    // Redirect based on role
    if (userSessionData.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/staff/dashboard');
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
