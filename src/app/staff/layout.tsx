
"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav, type NavItemGroup, type NavItem } from "@/components/layout/sidebar-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionsContext, type PermissionsContextType } from '@/hooks/use-permissions';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  branchName?: string;
  branchId?: string;
  name?: string;
}

const buildStaffSidebarNavItems = (user: UserProfile | null): NavItemGroup[] => {
    if (!user) return [];

    const permissions = new Set(user.permissions || []);
    const hasPermission = (p: string) => permissions.has(p);

    const navItems: NavItemGroup[] = [];

    // Always show dashboard
    navItems.push({
        items: [{ title: "Dashboard", href: "/staff/dashboard", iconName: "LayoutDashboard" }]
    });

    const customerMeteringItems: NavItem[] = [];
    if (hasPermission('bulk_meters_view_branch')) customerMeteringItems.push({ title: "Bulk Meters", href: "/staff/bulk-meters", iconName: "Gauge" });
    if (hasPermission('customers_view_branch')) customerMeteringItems.push({ title: "Individual Customers", href: "/staff/individual-customers", iconName: "Users" });

    if (customerMeteringItems.length > 0) {
        navItems.push({ title: "Customer & Metering", items: customerMeteringItems });
    }

    const dataReportsItems: NavItem[] = [];
    if (hasPermission('data_entry_access')) dataReportsItems.push({ title: "Data Entry", href: "/staff/data-entry", iconName: "FileText" });
    if (hasPermission('meter_readings_view_branch')) dataReportsItems.push({ title: "Meter Readings", href: "/staff/meter-readings", iconName: "ClipboardList" });
    if (hasPermission('reports_generate_branch')) dataReportsItems.push({ title: "Reports", href: "/staff/reports", iconName: "BarChart2" });
    
    // Dynamically add Tariff Management if permission exists
    if (hasPermission('tariffs_view')) {
      dataReportsItems.push({ title: "Tariff Management", href: "/staff/tariffs", iconName: "LibraryBig" });
    }

    if (dataReportsItems.length > 0) {
        navItems.push({ title: "Data & Reports", items: dataReportsItems });
    }

    return navItems;
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                router.replace("/");
            }
        } else {
            router.replace("/");
        }
        setIsLoading(false);
    }, [router]);

    const navItems = buildStaffSidebarNavItems(user);

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

    if (!user) {
        return null;
    }
    
    return (
        <PermissionsContext.Provider value={permissionsValue}>
            <AppShell user={user} userRole="staff" sidebar={<SidebarNav items={navItems} />} >
                {children}
            </AppShell>
        </PermissionsContext.Provider>
    );
}
