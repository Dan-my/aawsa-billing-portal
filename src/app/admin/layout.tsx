
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav, type NavItemGroup } from "@/components/layout/sidebar-nav"; // Corrected import
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
} from "lucide-react";

const adminSidebarNavItems: NavItemGroup[] = [
  {
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Branch Management", href: "/admin/branches", icon: Building },
      { title: "Staff Management", href: "/admin/staff-management", icon: UserCog },
    ],
  },
  {
    title: "Customer & Metering",
    items: [
      { title: "Bulk Meters", href: "/admin/bulk-meters", icon: Gauge },
      { title: "Individual Customers", href: "/admin/individual-customers", icon: Users },
    ],
  },
  {
    title: "Data & Reports",
    items: [
      { title: "Data Entry", href: "/admin/data-entry", icon: FileText },
      { title: "Reports", href: "/admin/reports", icon: BarChart2 },
    ],
  },
  {
    items: [
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];


export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell userRole="admin" sidebar={<SidebarNav items={adminSidebarNavItems} />}>{children}</AppShell>;
}

