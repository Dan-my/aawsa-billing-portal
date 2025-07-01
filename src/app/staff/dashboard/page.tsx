
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, Gauge, Users, ArrowRight, FileText, TrendingUp } from 'lucide-react'; 
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
  role: "admin" | "staff" | "Admin" | "Staff";
  branchName?: string;
}

const chartConfig = {
  paid: { label: "Paid", color: "hsl(var(--chart-1))" }, 
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-3))" }, 
} satisfies import("@/components/ui/chart").ChartConfig;

export default function StaffDashboardPage() {
  const [authStatus, setAuthStatus] = React.useState<'loading' | 'unauthorized' | 'authorized'>('loading');
  const [staffBranchName, setStaffBranchName] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allCustomers, setAllCustomers] = React.useState<IndividualCustomer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Auth check
  React.useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const parsedUser: User = JSON.parse(userString);
        if (parsedUser.role.toLowerCase() === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
          setAuthStatus('authorized');
        } else {
          setAuthStatus('unauthorized');
        }
      } catch (e) {
        setAuthStatus('unauthorized');
      }
    } else {
      setAuthStatus('unauthorized');
    }
  }, []); 

  // Data loading, dependent on auth
  React.useEffect(() => {
    if (authStatus !== 'authorized') {
      if (authStatus !== 'loading') setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const initializeAndSubscribe = async () => {
        try {
          await Promise.all([initializeBranches(), initializeBulkMeters(), initializeCustomers()]);
          if (isMounted) {
            setAllBranches(getBranches());
            setAllBulkMeters(getBulkMeters());
            setAllCustomers(getCustomers());
          }
        } catch (err) {
            console.error("Failed to initialize dashboard data:", err);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };
    
    initializeAndSubscribe();
    
    const unSubBranches = subscribeToBranches((data) => isMounted && setAllBranches(data));
    const unSubBulkMeters = subscribeToBulkMeters((data) => isMounted && setAllBulkMeters(data));
    const unSubCustomers = subscribeToCustomers((data) => isMounted && setAllCustomers(data));

    return () => {
      isMounted = false;
      unSubBranches();
      unSubBulkMeters();
      unSubCustomers();
    };
  }, [authStatus]);

  // Derived state with useMemo
  const branchStats = React.useMemo(() => {
    if (authStatus !== 'authorized' || !staffBranchName || allBranches.length === 0) {
      return { totalBulkMeters: 0, totalCustomers: 0, totalBills: 0, paidBills: 0, unpaidBills: 0, billsData: [], monthlyPerformance: [], paidPercentage: "0%" };
    }

    const normalizedStaffBranchName = staffBranchName.trim().toLowerCase();
    const staffBranch = allBranches.find(b => {
      const normalizedBranchName = b.name.trim().toLowerCase();
      return normalizedBranchName.includes(normalizedStaffBranchName) || normalizedStaffBranchName.includes(normalizedBranchName);
    });
    
    if (!staffBranch) {
      return { totalBulkMeters: 0, totalCustomers: 0, totalBills: 0, paidBills: 0, unpaidBills: 0, billsData: [], monthlyPerformance: [], paidPercentage: "0%" };
    }
    
    const branchBMs = allBulkMeters.filter(bm => bm.branchId === staffBranch.id);
    const branchBMKeys = new Set(branchBMs.map(bm => bm.customerKeyNumber));

    const branchCustomers = allCustomers.filter(customer =>
      customer.branchId === staffBranch.id ||
      (customer.assignedBulkMeterId && branchBMKeys.has(customer.assignedBulkMeterId))
    );
      
    // Calculate Bills Status
    const paidCount = branchBMs.filter(bm => bm.paymentStatus === 'Paid').length + branchCustomers.filter(c => c.paymentStatus === 'Paid').length;
    const unpaidCount = branchBMs.filter(bm => bm.paymentStatus !== 'Paid').length + branchCustomers.filter(c => c.paymentStatus !== 'Paid').length;
    const totalBillsCount = paidCount + unpaidCount;
    
    const billsData = [
        { name: 'Paid', value: paidCount, fill: 'hsl(var(--chart-1))' },
        { name: 'Unpaid', value: unpaidCount, fill: 'hsl(var(--chart-3))' },
    ];

    // Calculate Monthly Performance
    const monthlyMap = new Map<string, { paid: number; unpaid: number }>();
    
    branchBMs.forEach(bm => {
        if (!bm.month) return;
        const entry = monthlyMap.get(bm.month) || { paid: 0, unpaid: 0 };
        if (bm.paymentStatus === 'Paid') entry.paid++;
        else entry.unpaid++;
        monthlyMap.set(bm.month, entry);
    });

    branchCustomers.forEach(c => {
        if (!c.month) return;
        const entry = monthlyMap.get(c.month) || { paid: 0, unpaid: 0 };
        if (c.paymentStatus === 'Paid') entry.paid++;
        else entry.unpaid++;
        monthlyMap.set(c.month, entry);
    });

    const monthlyPerformance = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    
    const paidPercentage = totalBillsCount > 0 ? `${((paidCount / totalBillsCount) * 100).toFixed(0)}%` : "0%";

    return {
      totalBulkMeters: branchBMs.length,
      totalCustomers: branchCustomers.length,
      totalBills: totalBillsCount,
      paidBills: paidCount,
      unpaidBills: unpaidCount,
      billsData,
      monthlyPerformance,
      paidPercentage,
    };
  }, [authStatus, staffBranchName, allBranches, allBulkMeters, allCustomers]);


  if (isLoading || authStatus === 'loading') {
    return <div className="p-4 text-center">Loading dashboard data...</div>;
  }
  
  if (authStatus === 'unauthorized') {
      return (
        <div className="p-4 text-center">
             <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription>Your user profile is not correctly configured for a staff role or branch. Please contact an administrator.</CardDescription>
                </CardHeader>
             </Card>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Dashboard - {staffBranchName}</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bills Status (Current Cycle)</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchStats.totalBills.toLocaleString()} Bills</div>
            <p className="text-xs text-muted-foreground">{branchStats.paidBills} Paid / {branchStats.unpaidBills} Unpaid</p>
            <div className="h-[120px] mt-4">
               {isClient && (
                 <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={branchStats.billsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                              {branchStats.billsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                          </Pie>
                          <Tooltip content={<ChartTooltipContent hideLabel />} />
                          <Legend content={<ChartLegendContent />} />
                      </PieChart>
                  </ResponsiveContainer>
                 </ChartContainer>
               )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers in {staffBranchName}</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchStats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total customers assigned to your branch</p>
             <div className="h-[120px] mt-4 flex items-center justify-center">
                <Users className="h-16 w-16 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulk Meters in {staffBranchName}</CardTitle>
            <Gauge className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchStats.totalBulkMeters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total bulk meters assigned to your branch</p>
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
          <CardTitle>Monthly Billing Performance ({staffBranchName})</CardTitle>
          <CardDescription>Paid vs. Unpaid bills over the last few months in your branch.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isClient && branchStats.monthlyPerformance.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchStats.monthlyPerformance}>
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="paid" stackId="a" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unpaid" stackId="a" fill="var(--color-unpaid)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No monthly performance data available to display.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    