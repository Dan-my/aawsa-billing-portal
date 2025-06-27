
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
import { supabase } from "@/lib/supabase"; // Import supabase client

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

    // Use Supabase Auth to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (authError || !authData.user) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: authError?.message || "Invalid email or password.",
      });
      setIsLoading(false);
      return;
    }

    // After successful Supabase auth, fetch the user's profile from staff_members
    const { data: userProfile, error: profileError } = await supabase
      .from('staff_members')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !userProfile) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not find a staff profile for this user.",
      });
      // Sign out the user since they don't have a profile
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    if (userProfile.status !== "Active") {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: `This account is currently ${userProfile.status}. Please contact an administrator.`,
      });
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    // We don't need to manually store the session in localStorage anymore.
    // The AppShell will handle this by listening to onAuthStateChange.

    toast({
      title: "Login Successful",
      description: "Welcome back! Redirecting...",
    });

    if (userProfile.role.toLowerCase() === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/staff/dashboard");
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
