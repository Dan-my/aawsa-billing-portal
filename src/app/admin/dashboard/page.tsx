
"use client";

import * as React from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, Building, Users, Gauge, ArrowRight, TableIcon, BarChartBig, TrendingUp, AlertCircle } from 'lucide-react'; 
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import { 
  getBulkMeters, subscribeToBulkMeters, initializeBulkMeters,
  getCustomers, subscribeToCustomers, initializeCustomers,
  getBills, subscribeToBills, initializeBills,
  getBranches, subscribeToBranches, initializeBranches,
  getMeterReadings, subscribeToMeterReadings, initializeMeterReadings
} from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import type { Bill as DomainBill, DomainMeterReading, DomainBranch } from "@/lib/data-store"; 
import { cn } from "@/lib/utils";

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const PieChartRecharts = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const LineChartRecharts = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const RechartsBar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });


const chartConfig = {
  paid: { label: "Paid", color: "hsl(var(--chart-1))" },
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" },
  bulkMeters: { label: "Bulk Meters", color: "hsl(var(--chart-1))" },
  individualCustomers: { label: "Customers", color: "hsl(var(--chart-2))" },
  waterUsage: { label: "Water Usage (m³)", color: "hsl(var(--chart-1))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AdminDashboardPage() {
  const [showBranchPerformanceTable, setShowBranchPerformanceTable] = React.useState(true);
  const [showWaterUsageTable, setShowWaterUsageTable] = React.useState(true);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dynamicTotalBulkMeterCountForStatusCard, setDynamicTotalBulkMeterCountForStatusCard] = React.useState<number>(0);
  const [dynamicPaidBulkMeterCount, setDynamicPaidBulkMeterCount] = React.useState<number>(0);
  const [dynamicUnpaidBulkMeterCount, setDynamicUnpaidBulkMeterCount] = React.useState<number>(0);
  
  const [dynamicTotalIndividualCustomerCount, setDynamicTotalIndividualCustomerCount] = React.useState<number>(0);
  const [dynamicTotalBulkMeterCountOverall, setDynamicTotalBulkMeterCountOverall] = React.useState<number>(0);
  
  const [dynamicBranchPerformanceData, setDynamicBranchPerformanceData] = React.useState<{ branch: string; paid: number; unpaid: number }[]>([]);
  const [dynamicWaterUsageTrendData, setDynamicWaterUsageTrendData] = React.useState<{ month: string; usage: number }[]>([]);

  const processDashboardData = React.useCallback(() => {
    const currentBranches = getBranches();
    const currentBulkMeters = getBulkMeters();
    const currentCustomers = getCustomers();
    // const currentBills = getBills(); // Still available if needed for other purposes
    // const currentMeterReadings = getMeterReadings(); // No longer used for water usage trend

    // Overall Bulk Meter Status (for the first card)
    const paidOverallBulkMeters = currentBulkMeters.filter(bm => bm.paymentStatus === 'Paid').length;
    const unpaidOverallBulkMeters = currentBulkMeters.filter(bm => bm.paymentStatus === 'Unpaid').length; 
    setDynamicTotalBulkMeterCountForStatusCard(currentBulkMeters.length);
    setDynamicPaidBulkMeterCount(paidOverallBulkMeters);
    setDynamicUnpaidBulkMeterCount(unpaidOverallBulkMeters);

    // Overall counts for other cards
    setDynamicTotalBulkMeterCountOverall(currentBulkMeters.length);
    setDynamicTotalIndividualCustomerCount(currentCustomers.length);
    

    // Process Branch Performance Data (from bulk_meters table)
    const performanceMap = new Map<string, { branchName: string, paid: number, unpaid: number }>();
    currentBranches.forEach(branch => {
      performanceMap.set(branch.id, { branchName: branch.name, paid: 0, unpaid: 0 });
    });

    currentBulkMeters.forEach(bm => {
      let meterBranchId: string | undefined = bm.branchId;

      if (!meterBranchId) {
        for (const branch of currentBranches) {
          const simpleBranchName = branch.name.replace(/ Branch$/i, "").toLowerCase().trim();
          const simpleBranchLocation = branch.location.toLowerCase().trim();

          const bmLocation = (bm.location?.toLowerCase() || "");
          const bmWard = (bm.ward?.toLowerCase() || "");
          const bmName = (bm.name?.toLowerCase() || "");

          if (bmLocation.includes(simpleBranchName) || bmLocation.includes(simpleBranchLocation) ||
              bmWard.includes(simpleBranchName) || bmWard.includes(simpleBranchLocation) ||
              bmName.includes(simpleBranchName) || bmName.includes(simpleBranchLocation)) {
            meterBranchId = branch.id;
            break; 
          }
        }
      }

      if (meterBranchId && performanceMap.has(meterBranchId)) {
        const entry = performanceMap.get(meterBranchId)!;
        if (bm.paymentStatus === 'Paid') {
          entry.paid++;
        } else if (bm.paymentStatus === 'Unpaid') { 
          entry.unpaid++;
        }
        performanceMap.set(meterBranchId, entry);
      }
    });
    setDynamicBranchPerformanceData(Array.from(performanceMap.values()).map(p => ({ branch: p.branchName, paid: p.paid, unpaid: p.unpaid })));


    // Process Water Usage Trend Data from Bulk Meters
    const usageMap = new Map<string, number>();
    currentBulkMeters.forEach(bm => {
      if (bm.month && typeof bm.bulkUsage === 'number') { // Ensure month and bulkUsage are valid
        const currentMonthUsage = usageMap.get(bm.month) || 0;
        usageMap.set(bm.month, currentMonthUsage + bm.bulkUsage);
      }
    });
    const trendData = Array.from(usageMap.entries())
      .map(([month, usage]) => ({ month, usage }))
      .sort((a, b) => {
        // Sort by date, ensuring 'YYYY-MM' strings are compared correctly
        const dateA = new Date(a.month + "-01");
        const dateB = new Date(b.month + "-01");
        return dateA.getTime() - dateB.getTime();
      }); 
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
          initializeBills(),
          initializeMeterReadings(),
        ]);

        if (!isMounted) return;
        processDashboardData();

      } catch (err) {
        console.error("Error initializing dashboard data:", err);
        if (isMounted) {
          setError("Failed to load dashboard data. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    const unsubBranches = subscribeToBranches(() => { if (isMounted) processDashboardData(); });
    const unsubBulkMeters = subscribeToBulkMeters(() => { if (isMounted) processDashboardData(); });
    const unsubCustomers = subscribeToCustomers(() => { if (isMounted) processDashboardData(); });
    const unsubBills = subscribeToBills(() => { if (isMounted) processDashboardData(); });
    const unsubMeterReadings = subscribeToMeterReadings(() => { if (isMounted) processDashboardData(); });
    
    return () => {
      isMounted = false;
      unsubBranches();
      unsubBulkMeters();
      unsubCustomers();
      unsubBills();
      unsubMeterReadings();
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

  const totalCustomersAndMeters = dynamicTotalIndividualCustomerCount + dynamicTotalBulkMeterCountOverall;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulk Meter Payment Status</CardTitle>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicTotalBulkMeterCountForStatusCard.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dynamicPaidBulkMeterCount.toLocaleString()} Paid / {dynamicUnpaidBulkMeterCount.toLocaleString()} Unpaid
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer & Meter Counts</CardTitle>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomersAndMeters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total registered entities</p>
          </CardContent>
        </Card>

         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bulk Meters (Overall)</CardTitle>
            <Gauge className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dynamicTotalBulkMeterCountOverall.toLocaleString()}</div>
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
                 <Gauge className="mr-3 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold text-base">View Bulk Meters</p>
                        <p className="text-xs text-muted-foreground">Manage all bulk water meters.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-primary" />
                </Button>
            </Link>
             <Link href="/admin/individual-customers" passHref>
                <Button variant="outline" className="w-full justify-start p-4 h-auto quick-access-btn">
                    <Users className="mr-3 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold text-base">View Individual Customers</p>
                        <p className="text-xs text-muted-foreground">Manage all individual customer accounts.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-primary" />
                </Button>
            </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Branch Performance (Paid vs Unpaid Bulk Meters)</CardTitle>
               <CardDescription>Comparison of bulk meter payment status across branches.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowBranchPerformanceTable(!showBranchPerformanceTable)}>
              {showBranchPerformanceTable ? <BarChartBig className="mr-2 h-4 w-4" /> : <TableIcon className="mr-2 h-4 w-4" />}
              {showBranchPerformanceTable ? "View Chart" : "View Table"}
            </Button>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className={cn("w-full h-full", { "hidden": showBranchPerformanceTable })}>
             {dynamicBranchPerformanceData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={dynamicBranchPerformanceData} barCategoryGap="20%">
                  <XAxis dataKey="branch" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <RechartsBar dataKey="paid" fill="hsl(var(--chart-1))" name={chartConfig.paid.label} />
                  <RechartsBar dataKey="unpaid" fill="hsl(var(--chart-2))" name={chartConfig.unpaid.label} />
                </BarChart>
              </ChartContainer>
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No branch performance data available for chart.
                </div>
              )}
            </div>
            <div className={cn("overflow-auto h-full", { "hidden": !showBranchPerformanceTable })}>
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
                        <TableCell className="text-right" style={{color: chartConfig.paid.color }}>{item.paid}</TableCell>
                        <TableCell className="text-right" style={{color: chartConfig.unpaid.color }}>{item.unpaid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No branch performance data available for table.
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Overall Water Usage Trend</CardTitle>
              <CardDescription>Monthly water consumption across all meters.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowWaterUsageTable(!showWaterUsageTable)}>
              {showWaterUsageTable ? <TrendingUp className="mr-2 h-4 w-4" /> : <TableIcon className="mr-2 h-4 w-4" />}
              {showWaterUsageTable ? "View Chart" : "View Table"}
            </Button>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className={cn("w-full h-full", { "hidden": showWaterUsageTable })}>
            {dynamicWaterUsageTrendData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChartRecharts data={dynamicWaterUsageTrendData}>
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))" }} activeDot={{ r:6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))"}} name={chartConfig.waterUsage.label} />
                </LineChartRecharts>
              </ChartContainer>
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No water usage data available for chart.
                </div>
              )}
            </div>
            <div className={cn("overflow-auto h-full", { "hidden": !showWaterUsageTable })}>
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
                      <TableCell className="text-right" style={{color: chartConfig.waterUsage.color}}>{item.usage.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No water usage data available for table.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    

    



