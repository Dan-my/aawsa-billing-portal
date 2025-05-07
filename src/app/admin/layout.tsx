import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav } from "@/components/ui/sidebar";

const sidebarNavItems = [
  {
    title: "Customer Management",
    items: [
      {
        title: "Individual Customer Management",
        href: "/admin/individual-customers",
      },
      {
        title: "Bulk Meters",
        href: "/admin/bulk-meters",
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell userRole="admin" sidebar={<SidebarNav items={sidebarNavItems} />}>{children}</AppShell>;
}
