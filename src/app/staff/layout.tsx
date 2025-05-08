
import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/app-shell"; // Changed to relative path
import { SidebarNav, type NavItemGroup } from "@/components/layout/sidebar-nav";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
} from "lucide-react";

const staffSidebarNavItems: NavItemGroup[] = [
   {
    items: [
      { title: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Data Entry", href: "/staff/data-entry", icon: FileText },
      { title: "Meter Readings", href: "/staff/meter-readings", icon: ClipboardList },
    ],
  },
];


export default function StaffLayout({ children }: { children: ReactNode }) {
  return <AppShell userRole="staff" sidebar={<SidebarNav items={staffSidebarNavItems} />}>{children}</AppShell>;
}
