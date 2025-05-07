
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, Building, Users, Gauge, ArrowRight, TableIcon, BarChartBig, TrendingUp } from 'lucide-react'; 
import { ResponsiveContainer, BarChart, PieChart, LineChart, XAxis, YAxis, Tooltip, Legend, Pie, Cell, Line, Bar } from 'recharts'; 
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBulkMeters, subscribeToBulkMeters, initializeBulkMeters } from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import { initialBulkMeters } from "../bulk-meters/page";


const totalBillsData = [
  { status: 'Paid', count: 1250, fill: 'hsl(var(--chart-1))' }, // Cyan
  { status: 'Unpaid', count: 350, fill: 'hsl(var(--chart-2))' }, // Gray
];

const customerCountData = [
  { name: 'Bulk Meters', value: 150, fill: 'hsl(var(--chart-1))' }, // Cyan
  { name: 'Individual Customers', value: 12030, fill: 'hsl(var(--chart-2))' }, // Gray
];

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
  paid: { label: "Paid", color: "hsl(var(--chart-1))" }, // Cyan
  unpaid: { label: "Unpaid", color: "hsl(var(--chart-2))" }, // Gray
  bulkMeters: { label: "Bulk Meters", color: "hsl(var(--chart-1))" }, // Cyan
  individualCustomers: { label: "Individual Customers", color: "hsl(var(--chart-2))" }, // Gray
  waterUsage: { label: "Water Usage (m³)", color: "hsl(var(--chart-1))" }, // Cyan
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AdminDashboardPage() {
  const [showBranchPerformanceTable, setShowBranchPerformanceTable] = React.useState(false);
  const [showWaterUsageTable, setShowWaterUsageTable] = React.useState(false);
  const [totalBulkMeters, setTotalBulkMeters] = React.useState<number>(0);

  React.useEffect(() => {
    if (getBulkMeters().length === 0) {
      initializeBulkMeters(initialBulkMeters);
    }
    
    const updateBulkMeterCount = (meters: BulkMeter[]) => {
      setTotalBulkMeters(meters.length);
    };
    
    updateBulkMeterCount(getBulkMeters()); // Initial count
    const unsubscribe = subscribeToBulkMeters(updateBulkMeterCount);
    return () => unsubscribe();
  }, []);


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
            <div className="text-2xl font-bold">1600</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            <div className="h-[120px] mt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={totalBillsData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={50} label>
                       {totalBillsData.map((entry, index) => (
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
            <CardTitle className="text-sm font-medium">Customer Counts</CardTitle>
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,180</div>
            <p className="text-xs text-muted-foreground">Total active customers</p>
            <div className="h-[120px] mt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={customerCountData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} label>
                       {customerCountData.map((entry, index) => (
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
            <CardTitle className="text-sm font-medium">Total Bulk Meters</CardTitle>
            <Gauge className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBulkMeters}</div>
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
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchPerformanceData}>
                    <XAxis dataKey="branch" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="paid" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /> 
                    <Bar dataKey="unpaid" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waterUsageTrendData}>
                    <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="usage" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))" }} activeDot={{ r:6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))"}} name={chartConfig.waterUsage.label} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

