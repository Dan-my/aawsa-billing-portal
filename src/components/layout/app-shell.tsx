
"use client";

import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  Settings,
  BarChart2,
  LogOut,
  FileText,
  Building,
  ClipboardList,
  UserCog,
  LayoutDashboard, 
  Menu,
  Droplets, 
  ChevronDown,
  ChevronRight,
  UploadCloud,
  Gauge, 
  User, // Added for individual customer icon
  Upload, // Added for CSV upload icon
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


interface UserSession {
  email: string;
  role: "admin" | "staff";
  branchName?: string; // Added for staff
}

const adminNavItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    label: "Management",
    icon: Settings,
    subItems: [
      { href: "/admin/branches", icon: Building, label: "Branches" },
      { href: "/admin/staff-management", icon: UserCog, label: "Staff" },
      { href: "/admin/bulk-meters", icon: Gauge, label: "Bulk Meters" },
      { href: "/admin/individual-customers", icon: Users, label: "Customers" },
    ],
  },
  { 
    label: "Data Entry", 
    icon: FileText, 
    subItems: [
      { href: "/admin/data-entry#individual-manual", icon: User, label: "Individual (Manual)" },
      { href: "/admin/data-entry#bulk-manual", icon: Gauge, label: "Bulk Meter (Manual)" },
      { href: "/admin/data-entry#csv-upload", icon: Upload, label: "CSV Upload" },
    ]
  },
  { href: "/admin/reports", icon: BarChart2, label: "Reports" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

const staffNavItems = [
  { href: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/staff/meter-readings", icon: ClipboardList, label: "Meter Readings" },
  { 
    label: "Data Entry", 
    icon: UploadCloud, 
    subItems: [
      { href: "/staff/data-entry#individual-manual", icon: User, label: "Individual (Manual)" },
      { href: "/staff/data-entry#bulk-manual", icon: Gauge, label: "Bulk Meter (Manual)" },
      { href: "/staff/data-entry#csv-upload", icon: Upload, label: "CSV Upload" },
    ]
  },
];

interface AppShellProps {
  children: ReactNode;
  userRole: "admin" | "staff";
}

function CollapsibleSidebarMenuItem({ item, currentPath }: { item: NavItemWithSubItems; currentPath: string }) {
  const { open: sidebarOpen } = useSidebar();
  // Parent item is active if currentPath (pathname + hash) starts with any subItem's href (pathname + hash)
  // or if currentPath (pathname + hash) starts with the item's own href (for non-expandable items)
  const isParentActive = item.href ? currentPath.startsWith(item.href) : 
                         item.subItems?.some(sub => currentPath.startsWith(sub.href.split('#')[0]) && (sub.href.includes('#') ? currentPath.includes(sub.href.split('#')[1]) : true));

  const [isOpen, setIsOpen] = React.useState(
    item.subItems?.some(sub => currentPath.startsWith(sub.href)) || false
  );
  
  React.useEffect(() => {
     // Open section if a sub-item is active
    if (item.subItems?.some(sub => currentPath.startsWith(sub.href))) {
      setIsOpen(true);
    }
  }, [currentPath, item.subItems]);


  if (!item.subItems || item.subItems.length === 0) {
    return (
      <SidebarMenuItem>
        <Link href={item.href || "#"} legacyBehavior passHref>
          <SidebarMenuButton
            isActive={currentPath.startsWith(item.href || " ")}
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
        isActive={isParentActive}
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
                <SidebarMenuSubButton isActive={currentPath === subItem.href}>
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
  const [user, setUser] = React.useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentHash, setCurrentHash] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => {
        setCurrentHash(window.location.hash);
      };
      window.addEventListener('hashchange', handleHashChange, { passive: true });
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, []);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: UserSession = JSON.parse(storedUser);
        if (parsedUser.role === userRole) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("user");
          toast({ title: "Access Denied", description: "You do not have permission to access this page.", variant: "destructive" });
          router.replace("/");
        }
      } catch (error) {
        localStorage.removeItem("user");
        router.replace("/");
      }
    } else {
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
  const fullCurrentPath = pathname + currentHash;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LayoutDashboard className="h-12 w-12 animate-spin text-primary" /> 
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const getInitials = (email: string, branchName?: string) => {
    if (branchName) {
      const branchParts = branchName.replace(" Branch", "").split(" ");
      if (branchParts.length > 0 && branchParts[0]) {
        return branchParts[0].substring(0, 2).toUpperCase();
      }
    }
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (parts[0] && parts[0].length >=2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
           <Link href={userRole === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Droplets className="h-8 w-8 text-primary" /> 
            <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">AAWSA Portal</h1>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <CollapsibleSidebarMenuItem key={item.label} item={item} currentPath={fullCurrentPath} />
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://picsum.photos/seed/${user.email}/40/40`} data-ai-hint="profile avatar" />
                  <AvatarFallback>{getInitials(user.email, user.branchName)}</AvatarFallback>
                </Avatar>
                <div className="ml-2 text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium leading-none">{user.role === 'staff' && user.branchName ? user.branchName : user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.role === 'staff' && user.branchName ? user.branchName : user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.role}
                  </p>
                  {user.role === 'staff' && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
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
        </header>
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
