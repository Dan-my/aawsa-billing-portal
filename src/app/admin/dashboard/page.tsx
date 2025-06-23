
"use client";

import * as React from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, Clock, Gauge, Users, ArrowRight, Table as TableIcon, TrendingUp, AlertCircle, PieChart as PieChartIcon } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getBulkMeters, subscribeToBulkMeters, initializeBulkMeters, getBulkMeterPaymentStatusCounts,
  getCustomers, subscribeToCustomers, initializeCustomers,
  getBranches, subscribeToBranches, initializeBranches
} from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import { cn } from "@/lib/utils";

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const PieChartRecharts = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

const chartConfig = {
  paid: { label: "Paid", color: "hsl(var(--chart-1))" },
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" },
  customers: { label: "Customers", color: "hsl(var(--chart-1))" },
  bulkMeters: { label: "Bulk Meters", color: "hsl(var(--chart-3))" },
  waterUsage: { label: "Water Usage (m³)", color: "hsl(var(--chart-1))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dynamicTotalBulkMeterCount, setDynamicTotalBulkMeterCount] = React.useState(0);
  const [dynamicPaidBulkMeterCount, setDynamicPaidBulkMeterCount] = React.useState(0);
  const [dynamicUnpaidBulkMeterCount, setDynamicUnpaidBulkMeterCount] = React.useState(0);
  const [bulkMeterPaymentStatusData, setBulkMeterPaymentStatusData] = React.useState<{ name: string; value: number; fill: string; }[]>([]);
  
  const [dynamicTotalEntityCount, setDynamicTotalEntityCount] = React.useState(0);
  const [customerBreakdownData, setCustomerBreakdownData] = React.useState<{ name: string; value: number; fill: string }[]>([]);
  
  const [dynamicBranchPerformanceData, setDynamicBranchPerformanceData] = React.useState<{ branch: string; paid: number; unpaid: number }[]>([]);
  const [dynamicWaterUsageTrendData, setDynamicWaterUsageTrendData] = React.useState<{ month: string; usage: number }[]>([]);

  const processDashboardData = React.useCallback(() => {
    const currentBranches = getBranches();
    const currentBulkMeters = getBulkMeters();
    const currentCustomers = getCustomers();

    // Bulk Meter Payment Status
    const { totalBMs, paidBMs, unpaidBMs } = getBulkMeterPaymentStatusCounts();
    setDynamicTotalBulkMeterCount(totalBMs);
    setDynamicPaidBulkMeterCount(paidBMs);
    setDynamicUnpaidBulkMeterCount(unpaidBMs);
    setBulkMeterPaymentStatusData([
      { name: 'Paid', value: paidBMs, fill: 'hsl(var(--chart-1))' },
      { name: 'Unpaid', value: unpaidBMs, fill: 'hsl(var(--chart-2))' },
    ]);

    // Customer and Meter Counts
    setDynamicTotalEntityCount(currentCustomers.length + totalBMs);
    setCustomerBreakdownData([
        { name: 'Customers', value: currentCustomers.length, fill: 'hsl(var(--chart-1))' },
        { name: 'Bulk Meters', value: totalBMs, fill: 'hsl(var(--chart-3))' },
    ]);

    // Branch Performance Data
    const performanceMap = new Map<string, { branchName: string, paid: number, unpaid: number }>();
    currentBranches.forEach(branch => {
      performanceMap.set(branch.id, { branchName: branch.name, paid: 0, unpaid: 0 });
    });

    currentBulkMeters.forEach(bm => {
      if (bm.branchId && performanceMap.has(bm.branchId)) {
        const entry = performanceMap.get(bm.branchId)!;
        if (bm.paymentStatus === 'Paid') entry.paid++;
        else if (bm.paymentStatus === 'Unpaid') entry.unpaid++;
        performanceMap.set(bm.branchId, entry);
      }
    });
    setDynamicBranchPerformanceData(Array.from(performanceMap.values()).map(p => ({ branch: p.branchName.replace(/ Branch$/i, ""), paid: p.paid, unpaid: p.unpaid })));


    // Water Usage Trend Data from Bulk Meters
    const usageMap = new Map<string, number>();
    currentBulkMeters.forEach(bm => {
      if (bm.month && typeof bm.bulkUsage === 'number') {
        const currentMonthUsage = usageMap.get(bm.month) || 0;
        usageMap.set(bm.month, currentMonthUsage + bm.bulkUsage);
      }
    });
    const trendData = Array.from(usageMap.entries())
      .map(([month, usage]) => ({ month, usage }))
      .sort((a, b) => new Date(a.month + "-01").getTime() - new Date(b.month + "-01").getTime()); 
    setDynamicWaterUsageTrendData(trendData);

  }, []);


  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        await Promise.all([
          initializeBranches(),
          initializeBulkMeters(),
          initializeCustomers(),
        ]);
        if (isMounted) processDashboardData();
      } catch (err) {
        console.error("Error initializing dashboard data:", err);
        if (isMounted) setError("Failed to load dashboard data. Please try again later.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    const unsubBranches = subscribeToBranches(() => { if (isMounted) processDashboardData(); });
    const unsubBulkMeters = subscribeToBulkMeters(() => { if (isMounted) processDashboardData(); });
    const unsubCustomers = subscribeToCustomers(() => { if (isMounted) processDashboardData(); });
    
    return () => {
      isMounted = false;
      unsubBranches();
      unsubBulkMeters();
      unsubCustomers();
    };
  }, [processDashboardData]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return (
        <div className="p-4">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <UIAlertDescription>{error}</UIAlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicTotalBulkMeterCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{dynamicPaidBulkMeterCount} Paid / {dynamicUnpaidBulkMeterCount} Unpaid</p>
            <div className="h-[120px] mt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer>
                  <PieChartRecharts>
                    <Pie data={bulkMeterPaymentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                      {bulkMeterPaymentStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Legend content={<ChartLegendContent />} />
                  </PieChartRecharts>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Counts</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicTotalEntityCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total active customers</p>
            <div className="h-[120px] mt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer>
                  <PieChartRecharts>
                    <Pie data={customerBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={50} label>
                      {customerBreakdownData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Legend content={<ChartLegendContent />} />
                  </PieChartRecharts>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bulk Meters</CardTitle>
            <Gauge className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicTotalBulkMeterCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total registered bulk meters</p>
            <div className="h-[120px] mt-4 flex items-center justify-center">
                <Gauge className="h-16 w-16 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Navigate quickly to key management areas.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/bulk-meters" passHref>
                <Button variant="outline" className="w-full justify-start p-4 h-auto quick-access-btn">
                 <Gauge className="mr-3 h-6 w-6" />
                    <div>
                        <p className="font-semibold text-base">View Bulk Meters</p>
                        <p className="text-xs text-muted-foreground">Manage all bulk water meters.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5" />
                </Button>
            </Link>
             <Link href="/admin/individual-customers" passHref>
                <Button variant="outline" className="w-full justify-start p-4 h-auto quick-access-btn">
                    <Users className="mr-3 h-6 w-6" />
                    <div>
                        <p className="font-semibold text-base">View Individual Customers</p>
                        <p className="text-xs text-muted-foreground">Manage all individual customer accounts.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5" />
                </Button>
            </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Branch Performance (Paid vs Unpaid)</CardTitle>
            <CardDescription>Comparison of bills status across branches.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[300px]">
              {dynamicBranchPerformanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Unpaid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicBranchPerformanceData.map((item) => (
                      <TableRow key={item.branch}>
                        <TableCell className="font-medium">{item.branch}</TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400">{item.paid}</TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400">{item.unpaid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No branch performance data available.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Overall Water Usage Trend</CardTitle>
            <CardDescription>Monthly water consumption across all meters.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[300px]">
              {dynamicWaterUsageTrendData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Water Usage (m³)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicWaterUsageTrendData.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell className="font-medium">{item.month}</TableCell>
                        <TableCell className="text-right">{item.usage.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No water usage data available.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
