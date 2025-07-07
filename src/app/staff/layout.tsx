
"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav, type NavItemGroup } from "@/components/layout/sidebar-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionsContext, type PermissionsContextType } from '@/hooks/use-permissions';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  branchName?: string;
  branchId?: string;
  name?: string;
}

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
      { title: "List Of Paid Bills", href: "/staff/reports/paid-bills", iconName: "CheckCircle2" },
      { title: "List Of Sent Bills", href: "/staff/reports/sent-bills", iconName: "Send" },
    ],
  },
];

export default function StaffLayout({ children }: { children: ReactNode }) {
    const [user, setUser] = React.useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
        setIsLoading(false);
    }, []);

    const permissionsValue: PermissionsContextType = React.useMemo(() => ({
        permissions: new Set(user?.permissions || []),
        hasPermission: (permission: string) => {
            return user?.permissions?.includes(permission) || false;
        }
    }), [user]);

    if (isLoading) {
       return (
         <div className="flex items-center justify-center h-screen">
           <Skeleton className="h-16 w-16" />
         </div>
       );
    }
    
    return (
        <AppShell userRole="staff" sidebar={<SidebarNav items={staffSidebarNavItems} />}>
            <PermissionsContext.Provider value={permissionsValue}>
                {children}
            </PermissionsContext.Provider>
        </AppShell>
    );
}

    
