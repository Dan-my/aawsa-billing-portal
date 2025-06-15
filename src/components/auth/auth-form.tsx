
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import next/image
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
// Droplets icon is no longer needed
import type { StaffMember } from "@/app/admin/staff-management/staff-types";
import { getStaffMembers, initializeStaffMembers, subscribeToStaffMembers } from "@/lib/data-store";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type UserRole = "admin" | "staff";

interface UserSessionData {
  email: string;
  role: UserRole;
  branchName?: string;
}

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [allStaffMembers, setAllStaffMembers] = React.useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(true);

  React.useEffect(() => {
    setIsLoadingStaff(true);
    initializeStaffMembers().then(() => {
      setAllStaffMembers(getStaffMembers());
      setIsLoadingStaff(false);
    });

    const unsubscribe = subscribeToStaffMembers((updatedStaff) => {
      setAllStaffMembers(updatedStaff);
    });
    return () => unsubscribe();
  }, []);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoadingStaff) {
        toast({
            title: "Authenticating",
            description: "Please wait, loading user data...",
        });
        return;
    }
    const { email, password } = values;

    let userSession: UserSessionData | null = null;
    let redirectTo = "";

    if (email === "admin@aawsa.com" && password === "password") {
      userSession = { email, role: "admin" };
      redirectTo = "/admin/dashboard";
    } else {
      const staffUser = allStaffMembers.find(staff => staff.email.toLowerCase() === email.toLowerCase());

      if (staffUser) {
        if (staffUser.password === password) {
          if (staffUser.status === "Active") {
            userSession = { email: staffUser.email, role: "staff", branchName: staffUser.branch };
            redirectTo = "/staff/dashboard";
          } else {
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Your account is not active. Please contact an administrator.",
            });
            return;
          }
        }
      }
    }

    if (userSession) {
      localStorage.setItem("user", JSON.stringify(userSession));
      toast({
        title: "Login Successful",
        description: `Welcome, ${userSession.role === 'admin' ? userSession.email : userSession.branchName}! Redirecting...`,
      });
      window.location.assign(redirectTo); 
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Admin: admin@aawsa.com. Staff: use your assigned email (e.g., kality@aawsa.com). Default password is 'password'.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center"> {/* Adjusted styling for the logo container */}
            <Image
              src="https://veiethiopia.com/photo/partner/par2.png"
              alt="AAWSA Logo"
              width={96} // Adjusted width for better visibility on login form
              height={60} // Adjusted height maintaining aspect ratio
              className="flex-shrink-0"
            />
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isLoadingStaff}>
                {form.formState.isSubmitting || isLoadingStaff ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Admin: admin@aawsa.com. Staff: use assigned email (e.g. kality@aawsa.com). Default password is 'password'.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
