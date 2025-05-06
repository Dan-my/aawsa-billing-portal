"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Users,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Droplets,
  UploadCloud,
  Building,
  UserCircle,
  Tachometer,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface AppShellProps {
  children: ReactNode;
  userRole: "admin" | "staff";
}

const navLinks = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/bulk-meters", label: "Bulk Meters", icon: Tachometer },
    { href: "/admin/individual-customers", label: "Individual Customers", icon: Users },
    { href: "/admin/data-entry", label: "Data Entry", icon: FileSpreadsheet },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/staff-management", label: "Staff Management", icon: UserCircle },
    { href: "/admin/branches", label: "Branches", icon: Building },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  staff: [
    { href: "/staff/dashboard", label: "Branch Dashboard", icon: LayoutDashboard },
    { href: "/staff/meter-readings", label: "Meter Readings", icon: Tachometer },
    { href: "/staff/data-entry", label: "Data Entry", icon: FileSpreadsheet },
  ],
};

export function AppShell({ children, userRole }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem("userRole");
    if (!storedRole) {
      router.push("/");
    } else if (storedRole !== userRole) {
      // If roles mismatch, redirect to appropriate dashboard or login
      router.push(storedRole === 'admin' ? '/admin/dashboard' : storedRole === 'staff' ? '/staff/dashboard' : '/');
    }
  }, [router, userRole]);


  const handleLogout = () => {
    localStorage.removeItem("userRole");
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/");
  };

  if (!mounted) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Droplets className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  const currentNavLinks = navLinks[userRole] || [];
  const userName = userRole === "admin" ? "Admin User" : "Staff User";
  const userEmail = userRole === "admin" ? "admin@aawsa.com" : "staff@aawsa.com";

  return (
    <SidebarProvider defaultOpen>
      <Sidebar SvgLogo={<Droplets className="w-6 h-6 text-primary" />} Title={<span className="font-bold text-lg">AAWSA Portal</span>}>
        <SidebarHeader className="flex items-center justify-between p-4 border-b">
            <Link href={userRole === "admin" ? "/admin/dashboard" : "/staff/dashboard"} className="flex items-center gap-2">
                <Droplets className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-semibold">AAWSA Portal</h1>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {currentNavLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === link.href || (link.href !== (userRole === "admin" ? "/admin/dashboard" : "/staff/dashboard") && pathname.startsWith(link.href))}
                >
                  <Link href={link.href}>
                    <link.icon />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-start gap-2 w-full p-2 h-auto">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://picsum.photos/seed/${userEmail}/40/40`} data-ai-hint="profile avatar" />
                  <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-left group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sm">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 bg-background border-b shadow-sm">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1">
                 {/* Can add breadcrumbs or page title here */}
            </div>
            {/* Add any header actions here, e.g. notifications */}
        </header>
        <main className="flex-1 p-6 overflow-auto">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// SvgLogo and Title components for Sidebar
const SvgLogo = ({ className }: { className?: string }) => (
  <Droplets className={cn("w-7 h-7 text-primary", className)} />
);

const Title = ({ children }: { children: ReactNode }) => (
  <h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
    {children}
  </h1>
);

Sidebar.defaultProps = {
  SvgLogo,
  Title,
};
