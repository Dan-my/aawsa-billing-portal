
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
  getBills, subscribeToBills, initializeBills 
} from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import type { Bill as DomainBill } from "@/lib/data-store"; 

const commonChartLoading = (heightClass: string) => (
  <div className={`w-full flex items-center justify-center text-xs text-muted-foreground ${heightClass}`}>
    Loading chart...
  </div>
);

// ResponsiveContainer is used for the top pie charts.
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
// BarChart, LineChart, etc., are direct children of ChartContainer (which has its own ResponsiveContainer) for the bottom charts.
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const PieChartRecharts = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false }); // Renamed to avoid conflict with Icon
const LineChartRecharts = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false }); // Renamed
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });


const branchPerformanceData = [
  { branch: 'Branch A', paid: 400, unpaid: 50 },
  { branch: 'Branch B', paid: 300, unpaid: 30 },
  { branch: 'Branch C', paid: 500, unpaid: 70 },
  { branch: 'Branch D', paid: 250, unpaid: 20 },
  { branch: 'Branch E', paid: 350, unpaid: 60 },
];

const waterUsageTrendData = [
  { month: 'Jan', usage: 4000 },
  { month: 'Feb', usage: 3000 },
  { month: 'Mar', usage: 2000 },
  { month: 'Apr', usage: 2780 },
  { month: 'May', usage: 1890 },
  { month: 'Jun', usage: 2390 },
  { month: 'Jul', usage: 3490 },
];

const chartConfig = {
  paid: { label: "Paid", color: "hsl(var(--chart-1))" },
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" },
  bulkMeters: { label: "Bulk Meters", color: "hsl(var(--chart-1))" },
  individualCustomers: { label: "Customers", color: "hsl(var(--chart-2))" },
  waterUsage: { label: "Water Usage (m³)", color: "hsl(var(--chart-1))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AdminDashboardPage() {
  const [showBranchPerformanceTable, setShowBranchPerformanceTable] = React.useState(false);
  const [showWaterUsageTable, setShowWaterUsageTable] = React.useState(false);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dynamicTotalBillCount, setDynamicTotalBillCount] = React.useState<number>(0);
  const [dynamicPaidBillCount, setDynamicPaidBillCount] = React.useState<number>(0);
  const [dynamicUnpaidBillCount, setDynamicUnpaidBillCount] = React.useState<number>(0);
  const [dynamicTotalIndividualCustomerCount, setDynamicTotalIndividualCustomerCount] = React.useState<number>(0);
  const [dynamicTotalBulkMeterCount, setDynamicTotalBulkMeterCount] = React.useState<number>(0);


  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        await Promise.all([
          initializeBulkMeters(),
          initializeCustomers(),
          initializeBills(),
        ]);

        if (!isMounted) return;

        const currentBulkMeters = getBulkMeters();
        const currentCustomers = getCustomers();
        const currentBills = getBills();

        setDynamicTotalBulkMeterCount(currentBulkMeters.length);
        setDynamicTotalIndividualCustomerCount(currentCustomers.length);
        
        const paid = currentBills.filter(b => b.paymentStatus === 'Paid').length;
        const unpaid = currentBills.filter(b => b.paymentStatus === 'Unpaid').length;
        setDynamicTotalBillCount(currentBills.length);
        setDynamicPaidBillCount(paid);
        setDynamicUnpaidBillCount(unpaid);

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

    const unsubscribeBulkMeters = subscribeToBulkMeters((meters) => {
      if (isMounted) setDynamicTotalBulkMeterCount(meters.length);
    });
    const unsubscribeCustomers = subscribeToCustomers((customers) => {
      if (isMounted) setDynamicTotalIndividualCustomerCount(customers.length);
    });
    const unsubscribeBills = subscribeToBills((bills) => {
      if (isMounted) {
        const paid = bills.filter(b => b.paymentStatus === 'Paid').length;
        const unpaid = bills.filter(b => b.paymentStatus === 'Unpaid').length;
        setDynamicTotalBillCount(bills.length);
        setDynamicPaidBillCount(paid);
        setDynamicUnpaidBillCount(unpaid);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribeBulkMeters();
      unsubscribeCustomers();
      unsubscribeBills();
    };
  }, []);

  const totalBillsChartData = React.useMemo(() => {
    return [
      { status: 'Paid', count: dynamicPaidBillCount, fill: chartConfig.paid.color },
      { status: 'Unpaid', count: dynamicUnpaidBillCount, fill: chartConfig.unpaid.color },
    ];
  }, [dynamicPaidBillCount, dynamicUnpaidBillCount]);

  const customerCountChartData = React.useMemo(() => {
    return [
      { name: 'Customers', value: dynamicTotalIndividualCustomerCount, fill: chartConfig.individualCustomers.color },
      { name: 'Bulk Meters', value: dynamicTotalBulkMeterCount, fill: chartConfig.bulkMeters.color },
    ];
  }, [dynamicTotalIndividualCustomerCount, dynamicTotalBulkMeterCount]);


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

  const totalCustomersAndMeters = dynamicTotalIndividualCustomerCount + dynamicTotalBulkMeterCount;

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
            <div className="text-2xl font-bold">{dynamicTotalBillCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dynamicPaidBillCount.toLocaleString()} Paid / {dynamicUnpaidBillCount.toLocaleString()} Unpaid
            </p>
            <div className="h-[120px] mt-4">
              {(totalBillsChartData.length > 0 && (totalBillsChartData.some(d => d.count > 0))) ? (
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChartRecharts>
                      <Pie data={totalBillsChartData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={50} label>
                        {totalBillsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} content={<ChartLegendContent nameKey="status" />} />
                    </PieChartRecharts>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No bill data available for chart.
                </div>
              )}
            </div>
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
            <div className="h-[120px] mt-4">
              {(customerCountChartData.length > 0 && (customerCountChartData.some(d => d.value > 0))) ? (
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChartRecharts>
                      <Pie data={customerCountChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} label>
                        {customerCountChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} content={<ChartLegendContent nameKey="name" />} />
                    </PieChartRecharts>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No customer/meter data for chart.
                </div>
              )}
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
                <Button variant="outline" className="w-full justify-start p-4 h-auto">
                 <Gauge className="mr-3 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold text-base">View Bulk Meters</p>
                        <p className="text-xs text-muted-foreground">Manage all bulk water meters.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </Button>
            </Link>
             <Link href="/admin/individual-customers" passHref>
                <Button variant="outline" className="w-full justify-start p-4 h-auto">
                    <Users className="mr-3 h-6 w-6 text-primary" />
                    <div>
                        <p className="font-semibold text-base">View Individual Customers</p>
                        <p className="text-xs text-muted-foreground">Manage all individual customer accounts.</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </Button>
            </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Branch Performance (Paid vs Unpaid)</CardTitle>
               <CardDescription>Comparison of bills status across branches.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowBranchPerformanceTable(!showBranchPerformanceTable)}>
              {showBranchPerformanceTable ? <BarChartBig className="mr-2 h-4 w-4" /> : <TableIcon className="mr-2 h-4 w-4" />}
              {showBranchPerformanceTable ? "View Chart" : "View Table"}
            </Button>
          </CardHeader>
          <CardContent className="h-[300px]">
            {showBranchPerformanceTable ? (
              <div className="overflow-auto h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Unpaid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchPerformanceData.map((item) => (
                      <TableRow key={item.branch}>
                        <TableCell className="font-medium">{item.branch}</TableCell>
                        <TableCell className="text-right" style={{color: chartConfig.paid.color }}>{item.paid}</TableCell>
                        <TableCell className="text-right" style={{color: chartConfig.unpaid.color }}>{item.unpaid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <ChartContainer 
                key={showBranchPerformanceTable ? 'bp-table-mode' : 'bp-chart-mode'} 
                config={chartConfig} 
                className="w-full h-full"
              >
                <BarChart key={showBranchPerformanceTable ? 'barchart-table' : 'barchart-chart'} data={branchPerformanceData}>
                  <XAxis dataKey="branch" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="paid" stackId="a" fill="hsl(var(--chart-1))" name={chartConfig.paid.label} />
                  <Bar dataKey="unpaid" stackId="a" fill="hsl(var(--chart-2))" name={chartConfig.unpaid.label} />
                </BarChart>
              </ChartContainer>
            )}
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
             {showWaterUsageTable ? (
                <div className="overflow-auto h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Water Usage (m³)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waterUsageTrendData.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell className="font-medium">{item.month}</TableCell>
                        <TableCell className="text-right" style={{color: chartConfig.waterUsage.color}}>{item.usage.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
             ) : (
              <ChartContainer 
                key={showWaterUsageTable ? 'wu-table-mode' : 'wu-chart-mode'}
                config={chartConfig} 
                className="w-full h-full"
              >
                <LineChartRecharts key={showWaterUsageTable ? 'linechart-table' : 'linechart-chart'} data={waterUsageTrendData}>
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))" }} activeDot={{ r:6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))"}} name={chartConfig.waterUsage.label} />
                </LineChartRecharts>
              </ChartContainer>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    
