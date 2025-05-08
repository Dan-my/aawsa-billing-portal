
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
  Droplets,
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

interface User {
  email: string;
  role: 'admin' | 'staff';
  branchName?: string;
}

interface AppHeaderContentProps {
   user: User | null;
   appName?: string;
}

function AppHeaderContent({ user, appName = "AAWSA Billing Portal" }: AppHeaderContentProps) {
  const { toggleSidebar, isMobile, state: sidebarState } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/'); // Redirect to login page
  };
  
  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard';

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
          <Droplets className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">{appName}</span>
        </Link>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden rounded-full h-8 w-8">
                <UserCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="truncate max-w-[200px]">{user.email}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-2">
                Role: {user.role === 'staff' && user.branchName ? `${user.role} (${user.branchName})` : user.role}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}


export function AppShell({ userRole, sidebar, children }: { userRole: 'admin' | 'staff', sidebar?: React.ReactNode, children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const [appName, setAppName] = React.useState("AAWSA Billing Portal");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const storedUserJson = localStorage.getItem('user');
    
    if (storedUserJson) {
      try {
        const parsedUser: User = JSON.parse(storedUserJson);
        
        if (parsedUser.role !== userRole) {
          // Role mismatch, clear stored user and redirect to login
          localStorage.removeItem('user');
          router.push('/');
          return;
        }

        // Check if the current path matches the user's role dashboard, if not, redirect
        const expectedPathPrefix = `/${parsedUser.role}`;
        const expectedDashboardPath = `${expectedPathPrefix}/dashboard`;

        if (pathname !== '/' && !pathname.startsWith(expectedPathPrefix)) {
          router.push(expectedDashboardPath);
          return;
        }
        
        setUser(parsedUser);

      } catch (error) {
        console.error("Failed to parse user from localStorage or role mismatch:", error);
        localStorage.removeItem('user');
        router.push('/');
        return;
      }
    } else if (pathname !== '/') { 
      // No user stored and not on login page, redirect to login
      router.push('/');
    }

    const storedAppName = localStorage.getItem("aawsa-app-name");
    if (storedAppName) {
      setAppName(storedAppName);
      if (typeof document !== 'undefined') {
        document.title = storedAppName;
      }
    }
  }, [router, userRole, pathname]);
  
  React.useEffect(() => {
    if (isMounted && typeof document !== 'undefined') {
      const storedDarkMode = localStorage.getItem("aawsa-dark-mode-default");
      if (storedDarkMode === "true") {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isMounted]);

  if (!isMounted) {
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

  // If on login page (pathname is '/'), render children directly without AppShell structure
  if (pathname === '/') {
      return <>{children}</>;
  }
  
  // If user is not yet set (still verifying) or does not match role for non-login pages, show loading/verification
  // This ensures that AppShell structure (sidebar, header) is not rendered prematurely or for unauthorized access attempts
  if (!user && pathname !== '/') {
    return (
         <div className="flex min-h-screen items-center justify-center bg-background">
            <p>Verifying session...</p> {/* Or a more sophisticated loader */}
         </div>
    );
  }

  // Render AppShell structure only if user is verified and on a protected page
  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-2">
          {/* Header content can be minimal if appName is in AppHeaderContent */}
        </SidebarHeader>
        <SidebarContent>
          {sidebar}
        </SidebarContent>
        <SidebarFooter>
          {/* Footer can be empty or have version info, etc. */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset> {/* This will contain the header and the main content area */}
        <AppHeaderContent user={user} appName={appName} />
        <main className="flex-1 p-4 sm:p-6 space-y-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
