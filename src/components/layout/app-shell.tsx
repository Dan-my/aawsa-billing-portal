
"use client";

import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  BarChart2,
  LogOut,
  FileText,
  Building,
  ClipboardList,
  UserCog,
  Tachometer,
  Menu,
  Droplets,
  ChevronDown,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';


interface User {
  email: string;
  role: "admin" | "staff";
}

const adminNavItems = [
  { href: "/admin/dashboard", icon: Tachometer, label: "Dashboard" },
  {
    label: "Management",
    icon: Settings,
    subItems: [
      { href: "/admin/branches", icon: Building, label: "Branches" },
      { href: "/admin/staff-management", icon: UserCog, label: "Staff" },
      { href: "/admin/bulk-meters", icon: Droplets, label: "Bulk Meters" },
      { href: "/admin/individual-customers", icon: Users, label: "Customers" },
    ],
  },
  { href: "/admin/data-entry", icon: FileText, label: "Data Entry" },
  { href: "/admin/reports", icon: BarChart2, label: "Reports" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

const staffNavItems = [
  { href: "/staff/dashboard", icon: Tachometer, label: "Dashboard" },
  { href: "/staff/meter-readings", icon: ClipboardList, label: "Meter Readings" },
  { href: "/staff/data-entry", icon: UploadCloud, label: "Data Entry" },
];

interface AppShellProps {
  children: ReactNode;
  userRole: "admin" | "staff";
}

function CollapsibleSidebarMenuItem({ item, currentPath }: { item: NavItemWithSubItems; currentPath: string }) {
  const { open: sidebarOpen } = useSidebar();
  const [isOpen, setIsOpen] = React.useState(
    item.subItems?.some(sub => currentPath.startsWith(sub.href)) || false
  );

  if (!item.subItems || item.subItems.length === 0) {
    return (
      <SidebarMenuItem>
        <Link href={item.href || "#"} legacyBehavior passHref>
          <SidebarMenuButton
            isActive={currentPath === item.href || (item.href && currentPath.startsWith(item.href))}
            tooltip={sidebarOpen ? undefined : item.label}
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
        className="justify-between"
        tooltip={sidebarOpen ? undefined : item.label}
        isActive={item.subItems?.some(sub => currentPath.startsWith(sub.href))}
      >
        <div className="flex items-center gap-2">
          <item.icon />
          <span>{item.label}</span>
        </div>
        {sidebarOpen && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
      </SidebarMenuButton>
      {isOpen && sidebarOpen && (
        <SidebarMenuSub>
          {item.subItems.map((subItem) => (
            <SidebarMenuSubItem key={subItem.href}>
              <Link href={subItem.href} legacyBehavior passHref>
                <SidebarMenuSubButton isActive={currentPath.startsWith(subItem.href)}>
                  <subItem.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span>{subItem.label}</span>
                </SidebarMenuSubButton>
              </Link>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}


type NavItem = {
  href?: string;
  icon: React.ElementType;
  label: string;
};
type NavItemWithSubItems = NavItem & { subItems?: NavItem[] };


export function AppShell({ children, userRole }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === userRole) {
          setUser(parsedUser);
        } else {
          // Role mismatch, redirect to login
          localStorage.removeItem("user");
          toast({ title: "Access Denied", description: "You do not have permission to access this page.", variant: "destructive" });
          router.replace("/");
        }
      } catch (error) {
        // Invalid JSON or other error, treat as not logged in
        localStorage.removeItem("user");
        router.replace("/");
      }
    } else {
      // No user in localStorage, redirect to login
      router.replace("/");
    }
    setIsLoading(false);
  }, [router, userRole, toast]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.replace("/");
  };

  const navItems = userRole === "admin" ? adminNavItems : staffNavItems;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Tachometer className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but it's a fallback.
    return null;
  }
  
  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
           <Link href={userRole === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <WaterIcon className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">AAWSA Portal</h1>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <CollapsibleSidebarMenuItem key={item.label} item={item} currentPath={pathname} />
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://picsum.photos/seed/${user.email}/40/40`} data-ai-hint="profile avatar" />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div className="ml-2 text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.role}
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

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:justify-end">
          <SidebarTrigger className="md:hidden" />
          {/* Placeholder for breadcrumbs or page title if needed */}
        </header>
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
