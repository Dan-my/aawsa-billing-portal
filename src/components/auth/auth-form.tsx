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
import { getStaffMembers, initializeStaffMembers, getBranches, initializeBranches } from "@/lib/data-store";

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
  
  React.useEffect(() => {
    // Pre-load data on component mount
    initializeStaffMembers();
    initializeBranches();
  }, []);

  const onSubmit = (values: LoginFormValues) => {
    setIsLoading(true);
    
    const staffList = getStaffMembers();
    const user = staffList.find(staff => staff.email.toLowerCase() === values.email.toLowerCase());

    if (user && user.password === values.password) {
      if(user.status !== "Active") {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: `This account is currently ${user.status}. Please contact an administrator.`,
          });
          setIsLoading(false);
          return;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting...",
      });
      
      const allBranches = getBranches();
      const userBranch = allBranches.find(b => b.id === user.branchId);

      const sessionUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        branchName: userBranch?.name || "Unknown Branch",
        name: user.name,
      };
      localStorage.setItem("user", JSON.stringify(sessionUser));

      const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
      localStorage.setItem('session_expires_at', String(Date.now() + INACTIVITY_TIMEOUT));

      if (user.role.toLowerCase() === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/staff/dashboard");
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password.",
      });
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
