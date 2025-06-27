
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
import { supabase } from "@/lib/supabase";
import { LogIn } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).regex(/^[a-zA-Z0-9._%+-]+@aawsa\.com$/, {
    message: "Email must be a valid @aawsa.com address.",
  }),
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
    try {
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }
      if (!sessionData.user) {
        throw new Error("Login failed: No user session returned.");
      }

      // After successful sign-in, the supabase client has the session.
      // Now, fetch the user's profile from the public table.
      const { data: staffMember, error: profileError } = await supabase
        .from("staff_members")
        .select("*")
        .eq("id", sessionData.user.id) // Query by the auth user's ID
        .single();
      
      if (profileError || !staffMember) {
        // This is a problem state. Auth user exists, but no profile.
        // We should sign them out.
        await supabase.auth.signOut();
        throw new Error("Login failed: User profile not found.");
      }

      if (staffMember.status !== 'Active') {
        await supabase.auth.signOut();
        throw new Error(`Your account is currently ${staffMember.status}. Please contact an administrator.`);
      }

      // Store the profile info in localStorage for the AppShell to use.
      const userSession = {
        email: staffMember.email,
        role: staffMember.role.toLowerCase(),
        branchName: staffMember.branch,
        id: staffMember.id,
      };
      
      localStorage.setItem("user", JSON.stringify(userSession));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${staffMember.name}!`,
      });

      if (userSession.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/staff/dashboard");
      }

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
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
