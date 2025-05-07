
"use client";
// This page now effectively acts as a redirect or placeholder for /staff/dashboard
// The actual dashboard content is in /staff/dashboard/page.tsx
// This component will fetch branchName and use it in its display.

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart as PieChartIcon, TrendingUp, Users, BarChart as BarChartIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart, 
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar, 
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

const billsData = [
  { name: 'Paid Bills', value: 85, fill: 'hsl(var(--chart-1))' }, // Updated to use chart-1
  { name: 'Unpaid Bills', value: 15, fill: 'hsl(var(--chart-2))' }, // Was destructive, changed to chart-2 for consistency
];

const monthlyPerformanceData = [
  { month: 'Jan', paid: 70, unpaid: 10 },
  { month: 'Feb', paid: 65, unpaid: 12 },
  { month: 'Mar', paid: 80, unpaid: 5 },
  { month: 'Apr', paid: 75, unpaid: 8 },
];

const chartConfig = {
  paid: { label: "Paid", color: "hsl(var(--chart-1))" }, // Updated to use chart-1
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" }, // Was destructive, changed to chart-2
  customers: { label: "Customers", color: "hsl(var(--chart-1))"},
} satisfies import("@/components/ui/chart").ChartConfig;

export default function StaffPage() { 
  const [branchName, setBranchName] = React.useState<string>("Your Branch");

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setBranchName(parsedUser.branchName);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Dashboard - {branchName}</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bills Status (Current Cycle)</CardTitle>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100 Bills</div>
            <p className="text-xs text-muted-foreground">85% paid rate</p>
            <div className="h-[120px] mt-4">
               <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={billsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                            {billsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartTooltipContent />
                    </PieChart>
                </ResponsiveContainer>
               </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers in {branchName}</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">250</div>
            <p className="text-xs text-muted-foreground">Total customers assigned</p>
             <div className="h-[120px] mt-4 flex items-center justify-center">
                <Users className="h-16 w-16 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Collection Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last cycle</p>
             <div className="h-[120px] mt-4 flex items-center justify-center">
                <TrendingUp className="h-16 w-16 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Billing Performance ({branchName})</CardTitle>
          <CardDescription>Paid vs. Unpaid bills over the last few months in your branch.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPerformanceData}>
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="paid" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /> 
                <Bar dataKey="unpaid" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
