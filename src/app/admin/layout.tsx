
"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SidebarNav, type NavItemGroup, type NavItem } from "@/components/layout/sidebar-nav"; 
import { Skeleton } from "@/components/ui/skeleton";

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

    const navItems: NavItemGroup[] = [];
    const isAdmin = user.role.toLowerCase() === 'admin';
    const permissions = new Set(user.permissions || []);

    // --- Dashboard ---
    let dashboardHref = "/admin/dashboard"; // Default for Admin
    if (user.role === 'Head Office Management') dashboardHref = '/admin/head-office-dashboard';
    if (user.role === 'Staff Management') dashboardHref = '/admin/staff-management-dashboard';
    
    if (isAdmin || permissions.has('dashboard_view_all') || permissions.has('dashboard_view_branch')) {
        navItems.push({
            items: [{ title: "Dashboard", href: dashboardHref, iconName: "LayoutDashboard" }]
        });
    }

    // --- Management Group ---
    const managementItems: NavItem[] = [];
    if (isAdmin || permissions.has('branches_view')) managementItems.push({ title: "Branch Management", href: "/admin/branches", iconName: "Building" });
    if (isAdmin || permissions.has('staff_view')) managementItems.push({ title: "Staff Management", href: "/admin/staff-management", iconName: "UserCog" });
    if (isAdmin || permissions.has('permissions_view')) managementItems.push({ title: "Roles & Permissions", href: "/admin/roles-and-permissions", iconName: "ShieldCheck" });
    if (isAdmin || permissions.has('notifications_view')) managementItems.push({ title: "Notifications", href: "/admin/notifications", iconName: "Bell" });
    if (isAdmin || permissions.has('tariffs_view')) managementItems.push({ title: "Tariff Management", href: "/admin/tariffs", iconName: "LibraryBig" }); 
    
    if (managementItems.length > 0) {
        navItems.push({ title: "Management", items: managementItems });
    }
    
    // --- Customer & Metering Group ---
    const customerMeteringItems: NavItem[] = [];
    if (isAdmin || permissions.has('bulk_meters_view_all') || permissions.has('bulk_meters_view_branch')) customerMeteringItems.push({ title: "Bulk Meters", href: "/admin/bulk-meters", iconName: "Gauge" });
    if (isAdmin || permissions.has('customers_view_all') || permissions.has('customers_view_branch')) customerMeteringItems.push({ title: "Individual Customers", href: "/admin/individual-customers", iconName: "Users" });

    if (customerMeteringItems.length > 0) {
        navItems.push({ title: "Customer & Metering", items: customerMeteringItems });
    }

    // --- Data & Reports Group ---
    const dataReportsItems: NavItem[] = [];
    if (isAdmin || permissions.has('data_entry_access')) dataReportsItems.push({ title: "Data Entry", href: "/admin/data-entry", iconName: "FileText" });
    if (isAdmin || permissions.has('meter_readings_view_all') || permissions.has('meter_readings_view_branch')) dataReportsItems.push({ title: "Meter Readings", href: "/admin/meter-readings", iconName: "ClipboardList" });
    if (isAdmin || permissions.has('reports_generate_all') || permissions.has('reports_generate_branch')) dataReportsItems.push({ title: "Reports", href: "/admin/reports", iconName: "BarChart2" });

    if (dataReportsItems.length > 0) {
        navItems.push({ title: "Data & Reports", items: dataReportsItems });
    }
    
    // --- Settings ---
    if (isAdmin || permissions.has('settings_view')) {
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

    if (isLoading) {
       return (
         <div className="flex items-center justify-center h-screen">
           <Skeleton className="h-16 w-16" />
         </div>
       );
    }


    return <AppShell userRole="admin" sidebar={<SidebarNav items={navItems} />} >{children}</AppShell>;
}
