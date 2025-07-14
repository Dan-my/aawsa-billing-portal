
"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav, type NavItemGroup, type NavItem } from "@/components/layout/sidebar-nav"; 
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

const buildSidebarNavItems = (user: UserProfile | null): NavItemGroup[] => {
    if (!user) return [];
    
    const permissions = new Set(user.permissions || []);
    // Admin role always has permission, otherwise check the permissions set.
    const hasPermission = (p: string) => user.role.toLowerCase() === 'admin' || permissions.has(p);

    const navItems: NavItemGroup[] = [];

    // --- Dashboard ---
    const userRoleLower = user.role.toLowerCase();
    let dashboardHref = "/admin/dashboard"; // Default for Admin
    if (userRoleLower === 'head office management') dashboardHref = '/admin/head-office-dashboard';
    if (userRoleLower === 'staff management') dashboardHref = '/admin/staff-management-dashboard';
    
    // Only show dashboard if user has either of the dashboard view permissions
    if (hasPermission('dashboard_view_all') || hasPermission('dashboard_view_branch')) {
        navItems.push({
            items: [{ title: "Dashboard", href: dashboardHref, iconName: "LayoutDashboard" }]
        });
    }

    // --- Management Group ---
    const managementItems: NavItem[] = [];
    if (hasPermission('branches_view')) managementItems.push({ title: "Branch Management", href: "/admin/branches", iconName: "Building" });
    if (hasPermission('staff_view')) managementItems.push({ title: "Staff Management", href: "/admin/staff-management", iconName: "UserCog" });
    if (hasPermission('customers_approve')) managementItems.push({ title: "Approvals", href: "/admin/approvals", iconName: "UserCheck" });
    if (hasPermission('permissions_view')) managementItems.push({ title: "Roles & Permissions", href: "/admin/roles-and-permissions", iconName: "ShieldCheck" });
    if (hasPermission('notifications_view')) managementItems.push({ title: "Notifications", href: "/admin/notifications", iconName: "Bell" });
    if (hasPermission('tariffs_view')) managementItems.push({ title: "Tariff Management", href: "/admin/tariffs", iconName: "LibraryBig" }); 
    
    if (managementItems.length > 0) {
        navItems.push({ title: "Management", items: managementItems });
    }
    
    // --- Customer & Metering Group ---
    const customerMeteringItems: NavItem[] = [];
    if (hasPermission('bulk_meters_view_all') || hasPermission('bulk_meters_view_branch')) customerMeteringItems.push({ title: "Bulk Meters", href: "/admin/bulk-meters", iconName: "Gauge" });
    if (hasPermission('customers_view_all') || hasPermission('customers_view_branch')) customerMeteringItems.push({ title: "Individual Customers", href: "/admin/individual-customers", iconName: "Users" });

    if (customerMeteringItems.length > 0) {
        navItems.push({ title: "Customer & Metering", items: customerMeteringItems });
    }

    // --- Data & Reports Group ---
    const dataReportsItems: NavItem[] = [];
    if (hasPermission('data_entry_access')) dataReportsItems.push({ title: "Data Entry", href: "/admin/data-entry", iconName: "FileText" });
    if (hasPermission('meter_readings_view_all') || hasPermission('meter_readings_view_branch')) dataReportsItems.push({ title: "Meter Readings", href: "/admin/meter-readings", iconName: "ClipboardList" });
    if (hasPermission('reports_generate_all') || hasPermission('reports_generate_branch')) {
        dataReportsItems.push({ title: "Reports", href: "/admin/reports", iconName: "BarChart2" });
        dataReportsItems.push({ title: "List Of Paid Bills", href: "/admin/reports/paid-bills", iconName: "CheckCircle2" });
        dataReportsItems.push({ title: "List Of Sent Bills", href: "/admin/reports/sent-bills", iconName: "Send" });
    }
    
    if (dataReportsItems.length > 0) {
        navItems.push({ title: "Data & Reports", items: dataReportsItems });
    }
    
    // --- Settings ---
    if (hasPermission('settings_view')) {
      navItems.push({
        items: [{ title: "Settings", href: "/admin/settings", iconName: "Settings" }]
      });
    }

    return navItems;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<UserProfile | null>(null);
    const [navItems, setNavItems] = React.useState<NavItemGroup[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setNavItems(buildSidebarNavItems(parsedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
        setIsLoading(false);
    }, []);

    const permissionsValue: PermissionsContextType = React.useMemo(() => ({
        permissions: new Set(user?.permissions || []),
        hasPermission: (permission: string) => {
            if (user?.role.toLowerCase() === 'admin') return true; // Admin always has permission
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
        <AppShell userRole="admin" sidebar={<SidebarNav items={navItems} />} >
            <PermissionsContext.Provider value={permissionsValue}>
                {children}
            </PermissionsContext.Provider>
        </AppShell>
    );
}
