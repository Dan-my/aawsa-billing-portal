
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
import { supabase, type StaffMemberUpdate } from "@/lib/supabase";

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

    // 1. Try to sign in normally
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInData.session) {
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting...`,
      });
      // AppShell's onAuthStateChange will handle the redirect
      setIsLoading(false);
      return;
    }

    // 2. If signIn fails with invalid credentials, check if it's a legacy user
    if (signInError && signInError.message === 'Invalid login credentials') {
      const { data: legacyProfile } = await supabase
        .from('staff_members')
        .select('*')
        .eq('email', values.email)
        .single();
      
      if (legacyProfile && legacyProfile.password === values.password) {
        // This is a legacy user! Let's migrate them.
        toast({ title: "First-time Login Detected", description: "Updating your account to the new security system..." });

        // A. Create the new user in Supabase Auth. A trigger will auto-create a basic profile.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });

        if (signUpError || !signUpData.user) {
          toast({ variant: "destructive", title: "Migration Failed", description: signUpError?.message || "Could not create your secure account. Please contact an admin." });
          setIsLoading(false);
          return;
        }
        
        // B. Prepare an update payload with the data from the legacy profile
        const profileUpdateData: StaffMemberUpdate = {
            name: legacyProfile.name,
            branch: legacyProfile.branch,
            status: legacyProfile.status,
            phone: legacyProfile.phone,
            hire_date: legacyProfile.hire_date,
            role: legacyProfile.role,
            password: null, // Ensure legacy password is not carried over
        };
        
        // C. Update the *newly created* profile with the legacy data.
        const { error: updateError } = await supabase
            .from('staff_members')
            .update(profileUpdateData)
            .eq('id', signUpData.user.id);

        if (updateError) {
             toast({ variant: "destructive", title: "Migration Failed", description: "Could not create your updated profile. Please contact an admin." });
             setIsLoading(false);
             return;
        }

        // D. Delete the old, unlinked profile record.
        const { error: deleteError } = await supabase.from('staff_members').delete().eq('id', legacyProfile.id);
        if (deleteError) {
             toast({ variant: "destructive", title: "Migration Cleanup Failed", description: "Could not remove old profile data. Please contact an admin." });
             // Don't block login, but alert the user and admin.
        }

        // Migration complete! The signUp call already started a session.
        toast({ title: "Account Updated Successfully!", description: "You are now logged in." });
        setIsLoading(false);
        // AppShell will do the rest.
        return;
      }
    }

    // If we're here, it's a genuine failed login attempt.
    toast({
      variant: "destructive",
      title: "Login Failed",
      description: signInError?.message || "Invalid credentials or user does not exist.",
    });
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
