
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav, type NavItemGroup } from "@/components/layout/sidebar-nav"; 
import {
  LayoutDashboard, 
  Users,
  Settings,
  BarChart2,
  FileText,
  Building,
  UserCog,
  Gauge,
  ClipboardList,
  LibraryBig,
  Bell, 
  ShieldCheck,
} from "lucide-react";

const adminSidebarNavItems: NavItemGroup[] = [
  {
    items: [
      { title: "Dashboard", href: "/admin/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Branch Management", href: "/admin/branches", iconName: "Building" },
      { title: "Staff Management", href: "/admin/staff-management", iconName: "UserCog" },
      { title: "Roles & Permissions", href: "/admin/roles-and-permissions", iconName: "ShieldCheck" },
      { title: "Notifications", href: "/admin/notifications", iconName: "Bell" },
      { title: "Tariff Management", href: "/admin/tariffs", iconName: "LibraryBig" }, 
    ],
  },
  {
    title: "Customer & Metering",
    items: [
      { title: "Bulk Meters", href: "/admin/bulk-meters", iconName: "Gauge" },
      { title: "Individual Customers", href: "/admin/individual-customers", iconName: "Users" },
    ],
  },
  {
    title: "Data & Reports",
    items: [
      { title: "Data Entry", href: "/admin/data-entry", iconName: "FileText" },
      { title: "Meter Readings", href: "/admin/meter-readings", iconName: "ClipboardList" },
      { title: "Reports", href: "/admin/reports", iconName: "BarChart2" },
    ],
  },
  {
    items: [
      { title: "Settings", href: "/admin/settings", iconName: "Settings" },
    ],
  },
];


export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell userRole="admin" sidebar={<SidebarNav items={adminSidebarNavItems} />} >{children}</AppShell>;
}
