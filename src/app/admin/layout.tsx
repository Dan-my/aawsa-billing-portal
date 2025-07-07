
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

const fullAdminSidebarNavItems: NavItemGroup[] = [
    {
        items: [{ title: "Dashboard", href: "/admin/dashboard", iconName: "LayoutDashboard" }]
    },
    { 
        title: "Management", 
        items: [
            { title: "Branch Management", href: "/admin/branches", iconName: "Building" },
            { title: "Staff Management", href: "/admin/staff-management", iconName: "UserCog" },
            { title: "Roles & Permissions", href: "/admin/roles-and-permissions", iconName: "ShieldCheck" },
            { title: "Notifications", href: "/admin/notifications", iconName: "Bell" },
            { title: "Tariff Management", href: "/admin/tariffs", iconName: "LibraryBig" }, 
        ]
    },
    { 
        title: "Customer & Metering", 
        items: [
            { title: "Bulk Meters", href: "/admin/bulk-meters", iconName: "Gauge" },
            { title: "Individual Customers", href: "/admin/individual-customers", iconName: "Users" },
        ]
    },
    { 
        title: "Data & Reports", 
        items: [
            { title: "Data Entry", href: "/admin/data-entry", iconName: "FileText" },
            { title: "Meter Readings", href: "/admin/meter-readings", iconName: "ClipboardList" },
            { title: "Reports", href: "/admin/reports", iconName: "BarChart2" },
            { title: "List Of Paid Bills", href: "/admin/reports/paid-bills", iconName: "CheckCircle2" },
            { title: "List Of Sent Bills", href: "/admin/reports/sent-bills", iconName: "Send" },
        ]
    },
    {
        items: [{ title: "Settings", href: "/admin/settings", iconName: "Settings" }]
    }
];


const buildSidebarNavItems = (user: UserProfile | null): NavItemGroup[] => {
    if (!user) return [];
    
    // Special case for Admin: always show everything.
    if (user.role.toLowerCase() === 'admin') {
        return fullAdminSidebarNavItems;
    }

    const navItems: NavItemGroup[] = [];
    const permissions = new Set(user.permissions || []);
    const userRoleLower = user.role.toLowerCase();

    // --- Dashboard ---
    let dashboardHref = "/admin/dashboard"; // Default for Admin
    if (userRoleLower === 'head office management') dashboardHref = '/admin/head-office-dashboard';
    if (userRoleLower === 'staff management') dashboardHref = '/admin/staff-management-dashboard';
    
    if (permissions.has('dashboard_view_all') || permissions.has('dashboard_view_branch')) {
        navItems.push({
            items: [{ title: "Dashboard", href: dashboardHref, iconName: "LayoutDashboard" }]
        });
    }

    // --- Management Group ---
    const managementItems: NavItem[] = [];
    if (permissions.has('branches_view')) managementItems.push({ title: "Branch Management", href: "/admin/branches", iconName: "Building" });
    if (permissions.has('staff_view')) managementItems.push({ title: "Staff Management", href: "/admin/staff-management", iconName: "UserCog" });
    if (permissions.has('permissions_view')) managementItems.push({ title: "Roles & Permissions", href: "/admin/roles-and-permissions", iconName: "ShieldCheck" });
    if (permissions.has('notifications_view')) managementItems.push({ title: "Notifications", href: "/admin/notifications", iconName: "Bell" });
    if (permissions.has('tariffs_view')) managementItems.push({ title: "Tariff Management", href: "/admin/tariffs", iconName: "LibraryBig" }); 
    
    if (managementItems.length > 0) {
        navItems.push({ title: "Management", items: managementItems });
    }
    
    // --- Customer & Metering Group ---
    const customerMeteringItems: NavItem[] = [];
    if (permissions.has('bulk_meters_view_all') || permissions.has('bulk_meters_view_branch')) customerMeteringItems.push({ title: "Bulk Meters", href: "/admin/bulk-meters", iconName: "Gauge" });
    if (permissions.has('customers_view_all') || permissions.has('customers_view_branch')) customerMeteringItems.push({ title: "Individual Customers", href: "/admin/individual-customers", iconName: "Users" });

    if (customerMeteringItems.length > 0) {
        navItems.push({ title: "Customer & Metering", items: customerMeteringItems });
    }

    // --- Data & Reports Group ---
    const dataReportsItems: NavItem[] = [];
    if (permissions.has('data_entry_access')) dataReportsItems.push({ title: "Data Entry", href: "/admin/data-entry", iconName: "FileText" });
    if (permissions.has('meter_readings_view_all') || permissions.has('meter_readings_view_branch')) dataReportsItems.push({ title: "Meter Readings", href: "/admin/meter-readings", iconName: "ClipboardList" });
    if (permissions.has('reports_generate_all') || permissions.has('reports_generate_branch')) {
        dataReportsItems.push({ title: "Reports", href: "/admin/reports", iconName: "BarChart2" });
    }
    
    // Add report links based on role for non-admins
    if (userRoleLower === 'head office management' || userRoleLower === 'staff management') {
        dataReportsItems.push({ title: "List Of Paid Bills", href: "/admin/reports/paid-bills", iconName: "CheckCircle2" });
        dataReportsItems.push({ title: "List Of Sent Bills", href: "/admin/reports/sent-bills", iconName: "Send" });
    }
    

    if (dataReportsItems.length > 0) {
        navItems.push({ title: "Data & Reports", items: dataReportsItems });
    }
    
    // --- Settings ---
    if (permissions.has('settings_view')) {
      navItems.push({
        items: [{ title: "Settings", href: "/admin/settings", iconName: "Settings" }]
      });
    }

    return navItems;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
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
