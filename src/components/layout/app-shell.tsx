
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

interface AppShellProps {
  userRole: 'admin' | 'staff';
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

function AppHeaderContent({ user, appName }: { user: User | null, appName?: string }) {
  const { toggleSidebar, isMobile, state: sidebarState } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile ? (
        <SidebarTrigger className="sm:hidden -ml-2"> {/* Adjusted margin for better alignment */}
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </SidebarTrigger>
      ) : (
         // Show trigger only if sidebar is collapsible or for consistency
        <SidebarTrigger className={cn(sidebarState === "expanded" && "group-data-[collapsible=icon]:hidden")}/>
      )}

      <div className="flex flex-1 items-center justify-between">
        <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} className="flex items-center gap-2 text-lg font-semibold">
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
              <DropdownMenuLabel className="truncate max-w-xs">{user.email}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-2">
                Role: {user.role === 'staff' ? `${user.role} (${user.branchName})` : user.role}
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


export function AppShell({ userRole, sidebar, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const [appName, setAppName] = React.useState("AAWSA Billing Portal");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        
        if (parsedUser.role !== userRole) {
          localStorage.removeItem('user');
          router.push('/');
          return;
        }
        // Ensure current path matches the user's role, otherwise redirect to their dashboard
        const expectedPathPrefix = `/${parsedUser.role}`;
        if(!pathname.startsWith(expectedPathPrefix) && pathname !== '/') {
            router.push(`${expectedPathPrefix}/dashboard`);
            return;
        }

        setUser(parsedUser);

      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
        router.push('/');
        return;
      }
    } else {
       if (pathname !== '/') { // Avoid redirect loop if already on login page
           router.push('/'); 
       }
    }

    const storedAppName = localStorage.getItem("aawsa-app-name");
    if (storedAppName) {
      setAppName(storedAppName);
      document.title = storedAppName;
    }
  }, [router, userRole, pathname]);
  
  React.useEffect(() => {
    if(isMounted){
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* You can use a more sophisticated Skeleton loader here if needed */}
        <div className="space-y-4 w-full max-w-xs">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // If on login page, don't render app shell
  if (pathname === '/') {
      return <>{children}</>;
  }
  
  // If user is not yet set (e.g. async check in progress) or doesn't match role for non-login pages
  if (!user && pathname !== '/') {
    return (
         <div className="flex min-h-screen items-center justify-center bg-background">
            <p>Verifying session...</p>
         </div>
    );
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-2">
          {/* Optional: Could add a logo or title here that's always visible in sidebar */}
        </SidebarHeader>
        <SidebarContent>
          {sidebar}
        </SidebarContent>
        <SidebarFooter>
          {/* Optional: Sidebar footer content */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeaderContent user={user} appName={appName} />
        <main className="flex-1 p-4 sm:p-6 space-y-6 bg-background"> {/* Ensure main content area has background */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
