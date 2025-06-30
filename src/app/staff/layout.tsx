
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell"; 
import { SidebarNav, type NavItemGroup } from "@/components/layout/sidebar-nav"; 
import {
  LayoutDashboard, 
  FileText,
  ClipboardList,
  BarChart2,
  Gauge,
  Users,
} from "lucide-react";

const staffSidebarNavItems: NavItemGroup[] = [
   {
    items: [
      { title: "Dashboard", href: "/staff/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    title: "Customer & Metering",
    items: [
      { title: "Bulk Meters", href: "/staff/bulk-meters", iconName: "Gauge" },
      { title: "Individual Customers", href: "/staff/individual-customers", iconName: "Users" },
    ],
  },
  {
    title: "Data & Reports",
    items: [
      { title: "Data Entry", href: "/staff/data-entry", iconName: "FileText" },
      { title: "Meter Readings", href: "/staff/meter-readings", iconName: "ClipboardList" },
      { title: "Reports", href: "/staff/reports", iconName: "BarChart2" }, 
    ],
  },
];


export default function StaffLayout({ children }: { children: ReactNode }) {
  return <AppShell userRole="staff" sidebar={<SidebarNav items={staffSidebarNavItems} />} >{children}</AppShell>;
}
