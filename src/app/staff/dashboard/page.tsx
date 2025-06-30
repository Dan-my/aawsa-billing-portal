
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Gauge, Users, ArrowRight } from 'lucide-react'; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, PieChart, XAxis, YAxis, Tooltip, Legend, Pie, Cell, Bar } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, getCustomers, subscribeToCustomers, initializeCustomers, getBranches, initializeBranches, subscribeToBranches } from "@/lib/data-store";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { Branch } from "@/app/admin/branches/branch-types";

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

const billsData = [
  { name: 'Paid Bills', value: 85, fill: 'hsl(var(--chart-1))' }, 
  { name: 'Unpaid Bills', value: 15, fill: 'hsl(var(--chart-2))' }, 
];

const monthlyPerformanceData = [
  { month: 'Jan', paid: 70, unpaid: 10 },
  { month: 'Feb', paid: 65, unpaid: 12 },
  { month: 'Mar', paid: 80, unpaid: 5 },
  { month: 'Apr', paid: 75, unpaid: 8 },
];

const chartConfig = {
  paid: { label: "Paid", color: "hsl(var(--chart-1))" }, 
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" }, 
  customers: { label: "Customers", color: "hsl(var(--chart-1))"}, 
  bulkMeters: { label: "Bulk Meters", color: "hsl(var(--primary))"},
} satisfies import("@/components/ui/chart").ChartConfig;

export default function StaffDashboardPage() {
  const [branchNameForDisplay, setBranchNameForDisplay] = React.useState<string>("Your Branch");
  const [totalBulkMetersInBranch, setTotalBulkMetersInBranch] = React.useState<number>(0);
  const [totalCustomersInBranch, setTotalCustomersInBranch] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);


  const updateBranchData = React.useCallback((
    allBulkMeters: BulkMeter[],
    allCustomers: IndividualCustomer[],
    allBranches: Branch[],
    currentStaffBranch: string | undefined
  ) => {
    if (currentStaffBranch) {
      const simpleBranchName = currentStaffBranch.replace(/ Branch$/i, "").toLowerCase().trim();
      const staffBranch = allBranches.find(b => b.name.toLowerCase().includes(simpleBranchName));

      const branchFilteredBulkMeters = allBulkMeters.filter(bm => {
        if (staffBranch && bm.branchId) {
            return bm.branchId === staffBranch.id;
        }
        return (bm.location?.toLowerCase() || "").includes(simpleBranchName);
      });
      setTotalBulkMetersInBranch(branchFilteredBulkMeters.length);

      const branchBulkMeterIds = branchFilteredBulkMeters.map(bm => bm.id);
      
      const branchFilteredCustomers = allCustomers.filter(c => {
        if (staffBranch && c.branchId) {
            return c.branchId === staffBranch.id;
        }
        if (c.assignedBulkMeterId && branchBulkMeterIds.includes(c.assignedBulkMeterId)) {
            return true;
        }
        return (c.location?.toLowerCase() || "").includes(simpleBranchName);
      });
      setTotalCustomersInBranch(branchFilteredCustomers.length);

    } else {
      setTotalBulkMetersInBranch(0);
      setTotalCustomersInBranch(0);
    }
  }, []);


  React.useEffect(() => {
    let isMounted = true;
    let localStaffBranch: string | undefined;
    
    setIsLoading(true);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          if (isMounted) setBranchNameForDisplay(parsedUser.branchName);
          localStaffBranch = parsedUser.branchName;
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
    
    Promise.all([
      initializeBulkMeters(), 
      initializeCustomers(),
      initializeBranches(),
    ]).then(() => {
      if (!isMounted) return;
      updateBranchData(getBulkMeters(), getCustomers(), getBranches(), localStaffBranch);
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing dashboard data:", error);
      setIsLoading(false);
    });

    const handleStoresUpdate = () => {
        if (isMounted) {
            updateBranchData(getBulkMeters(), getCustomers(), getBranches(), localStaffBranch);
        }
    };

    const unsubscribeBulkMeters = subscribeToBulkMeters(handleStoresUpdate);
    const unsubscribeCustomers = subscribeToCustomers(handleStoresUpdate);
    const unsubscribeBranches = subscribeToBranches(handleStoresUpdate);

    return () => {
      isMounted = false;
      unsubscribeBulkMeters();
      unsubscribeCustomers();
      unsubscribeBranches();
    };
  }, [updateBranchData]); 

  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Dashboard - {branchNameForDisplay}</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bills Status (Current Cycle)</CardTitle>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100 Bills</div>
            <p className="text-xs text-muted-foreground">85% paid rate (Sample Data)</p>
            <div className="h-[120px] mt-4">
               <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={billsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                            {billsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Legend content={<ChartLegendContent />} />
                    </PieChart>
                </ResponsiveContainer>
               </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers in {branchNameForDisplay}</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomersInBranch}</div>
            <p className="text-xs text-muted-foreground">Total customers assigned to bulk meters in your branch</p>
             <div className="h-[120px] mt-4 flex items-center justify-center">
                <Users className="h-16 w-16 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulk Meters in {branchNameForDisplay}</CardTitle>
            <Gauge className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBulkMetersInBranch}</div>
            <p className="text-xs text-muted-foreground">Bulk meters identified for your branch</p>
             <div className="h-[120px] mt-4 flex items-center justify-center">
                <Gauge className="h-16 w-16 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Navigate quickly to key management areas for your branch.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/staff/bulk-meters" passHref>
                <Button variant="outline" className="w-full justify-start p-4 h-auto quick-access-btn">
                 <Gauge className="mr-3 h-6 w-6" />
                    <div>
                        <p className="font-semibold text-base">View Bulk Meters</p>
                        <p className="text-xs text-muted-foreground">Manage bulk water meters in your branch.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5" />
                </Button>
            </Link>
             <Link href="/staff/individual-customers" passHref>
                <Button variant="outline" className="w-full justify-start p-4 h-auto quick-access-btn">
                    <Users className="mr-3 h-6 w-6" />
                    <div>
                        <p className="font-semibold text-base">View Individual Customers</p>
                        <p className="text-xs text-muted-foreground">Manage individual customer accounts in your branch.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5" />
                </Button>
            </Link>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Billing Performance ({branchNameForDisplay})</CardTitle>
          <CardDescription>Paid vs. Unpaid bills over the last few months in your branch. (Sample Data)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPerformanceData}>
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="paid" stackId="a" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unpaid" stackId="a" fill="var(--color-unpaid)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
