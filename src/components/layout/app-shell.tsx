
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { NotificationBell } from './notification-bell';

interface UserProfile {
  id: string; 
  email: string;
  role: string; // No longer a strict enum
  roleId?: number; // Added
  permissions?: string[]; // Added
  branchName?: string;
  branchId?: string;
  name?: string;
}

interface AppHeaderContentProps {
   user: UserProfile | null;
   appName?: string;
   onLogout: () => void;
}

function AppHeaderContent({ user, appName = "AAWSA Billing Portal", onLogout }: AppHeaderContentProps) {
  const { toggleSidebar, isMobile, state: sidebarState } = useSidebar();
  
  const dashboardHref = user?.role.toLowerCase() === 'admin' ? '/admin/dashboard' : '/staff/dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile ? (
        <SidebarTrigger className="sm:hidden -ml-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </SidebarTrigger>
      ) : (
        <SidebarTrigger className={cn(sidebarState === "expanded" && "group-data-[collapsible=icon]:hidden")}/>
      )}

      <div className="flex flex-1 items-center justify-between">
        <Link href={dashboardHref} className="flex items-center gap-2 text-lg font-semibold">
          <Image
            src="https://veiethiopia.com/photo/partner/par2.png"
            alt="AAWSA Logo"
            width={48}
            height={30}
            className="flex-shrink-0" 
          />
          <span className="hidden sm:inline-block">{appName}</span>
        </Link>
        <div className="flex items-center gap-4">
          {user && <NotificationBell user={user} />}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full h-8 w-8">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate max-w-[200px]">{user.name || user.email}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-2">
                  Role: {user.role === 'Staff' && user.branchName ? `Staff (${user.branchName})` : user.role}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

const ADMIN_ROLES = ['admin', 'head office management', 'staff management'];
const STAFF_ROLES = ['staff'];

export function AppShell({ userRole, sidebar, children }: { userRole: 'admin' | 'staff', children: React.ReactNode, sidebar?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [appName, setAppName] = React.useState("AAWSA Billing Portal");
  const [authChecked, setAuthChecked] = React.useState(false);
  const currentYear = new Date().getFullYear();

  const handleLogout = React.useCallback(async () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("session_expires_at");
      window.localStorage.removeItem("last-read-timestamp"); // Also clear notification timestamp
    }
    setUser(null);
    router.push("/");
  }, [router]);

  useIdleTimeout(handleLogout);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      setAuthChecked(true);
      return;
    }
    
    const storedAppName = window.localStorage.getItem("aawsa-app-name");
    if (storedAppName) {
      setAppName(storedAppName);
      document.title = storedAppName;
    }
    
    const storedDarkMode = window.localStorage.getItem("aawsa-dark-mode-default");
    document.documentElement.classList.toggle('dark', storedDarkMode === "true");

    const storedUser = window.localStorage.getItem('user');
    if (storedUser) {
        try {
            const parsedUser: UserProfile = JSON.parse(storedUser);
            const userRoleLower = parsedUser.role.toLowerCase();

            // Check if the user's role is authorized for the current layout (defined by the userRole prop)
            const isAuthorizedForLayout = 
              (userRole === 'admin' && ADMIN_ROLES.includes(userRoleLower)) ||
              (userRole === 'staff' && STAFF_ROLES.includes(userRoleLower));

            if (isAuthorizedForLayout) {
                setUser(parsedUser);
            } else {
                handleLogout();
            }
        } catch (e) {
            handleLogout();
        }
    } else if (pathname !== '/') {
        router.replace('/');
    }
    setAuthChecked(true);

  }, [pathname, router, userRole, handleLogout]);

  if (!authChecked) { 
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-xs p-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  
  if (pathname === '/') {
      return <>{children}</>;
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-2">
        </SidebarHeader>
        <SidebarContent>
          {sidebar}
        </SidebarContent>
        <SidebarFooter className="text-xs text-center text-muted-foreground p-2">
          Design and Developed by Daniel Temesgen
          &copy; {currentYear} {appName}. All rights reserved.
        </SidebarFooter>
      </Sidebar>
      <SidebarInset> 
        <AppHeaderContent user={user} appName={appName} onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:p-6 space-y-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
