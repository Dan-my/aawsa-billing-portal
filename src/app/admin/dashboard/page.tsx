
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, Building } from 'lucide-react'; // Added Building, aliased chart icons to avoid conflict with recharts components
import { ResponsiveContainer, BarChart, PieChart, LineChart, XAxis, YAxis, Tooltip, Legend, Pie, Cell, Line } from 'recharts'; // BarChart, PieChart, LineChart are recharts components
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; 


const totalBillsData = [
  { status: 'Paid', count: 1250, fill: 'hsl(var(--chart-2))' },
  { status: 'Unpaid', count: 350, fill: 'hsl(var(--destructive))' },
];

const customerCountData = [
  { name: 'Bulk Meters', value: 150, fill: 'hsl(var(--chart-1))' },
  { name: 'Individual Customers', value: 12030, fill: 'hsl(var(--chart-4))' },
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
  paid: { label: "Paid", color: "hsl(var(--chart-2))" },
  unpaid: { label: "Unpaid", color: "hsl(var(--destructive))" },
  bulkMeters: { label: "Bulk Meters", color: "hsl(var(--chart-1))" },
  individualCustomers: { label: "Individual Customers", color: "hsl(var(--chart-4))" },
  waterUsage: { label: "Water Usage (m³)", color: "hsl(var(--chart-1))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AdminDashboardPage() {
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
            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Currently operational branches</p>
             <div className="h-[120px] mt-4 flex items-center justify-center">
                <Building className="h-16 w-16 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Branch Performance (Paid vs Unpaid)</CardTitle>
            <CardDescription>Comparison of bills status across branches.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchPerformanceData}>
                  <XAxis dataKey="branch" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="paid" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unpaid" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Overall Water Usage Trend</CardTitle>
            <CardDescription>Monthly water consumption across all meters.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waterUsageTrendData}>
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))" }} activeDot={{ r:6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))"}} name="Water Usage (m³)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
