
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
import { getStaffMembers, initializeStaffMembers } from "@/lib/data-store";
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

  React.useEffect(() => {
    initializeStaffMembers();
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    await initializeStaffMembers();
    const staffMembers = getStaffMembers();
    
    const staffMember = staffMembers.find(
      (staff) => staff.email.toLowerCase() === values.email.toLowerCase()
    );

    if (!staffMember) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "No user found with that email address.",
      });
    } else if (!staffMember.password) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Your account does not have a password set. Please contact an administrator to reset it.",
      });
    } else if (staffMember.password !== values.password) {
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The password you entered is incorrect.",
      });
    } else if (staffMember.status !== 'Active') {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: `Your account is currently ${staffMember.status}. Please contact an administrator.`,
      });
    } else {
      // Successful login
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
