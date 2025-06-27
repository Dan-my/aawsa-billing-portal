
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
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string; 
  email: string;
  role: 'admin' | 'staff';
  branchName?: string;
  name?: string;
}

interface AppHeaderContentProps {
   user: UserProfile | null;
   appName?: string;
}

function AppHeaderContent({ user, appName = "AAWSA Billing Portal" }: AppHeaderContentProps) {
  const { toggleSidebar, isMobile, state: sidebarState } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
          <Image
            src="https://veiethiopia.com/photo/partner/par2.png"
            alt="AAWSA Logo"
            width={48}
            height={30}
            className="flex-shrink-0" 
          />
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
              <DropdownMenuLabel className="truncate max-w-[200px]">{user.name || user.email}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-2">
                Role: {user.role === 'staff' && user.branchName ? `Staff (${user.branchName})` : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [appName, setAppName] = React.useState("AAWSA Billing Portal");
  const [authChecked, setAuthChecked] = React.useState(false);
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    // --- General Setup ---
    const storedAppName = localStorage.getItem("aawsa-app-name");
    if (storedAppName) {
      setAppName(storedAppName);
      if (typeof document !== 'undefined') document.title = storedAppName;
    }
    
    if (typeof document !== 'undefined') {
      const storedDarkMode = localStorage.getItem("aawsa-dark-mode-default");
      document.documentElement.classList.toggle('dark', storedDarkMode === "true");
    }

    // --- Auth Listener ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        if (session) {
          // User is logged in, fetch their profile
          const { data: profile } = await supabase
            .from('staff_members')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const userProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email!,
              role: profile.role.toLowerCase() as 'admin' | 'staff',
              branchName: profile.branch,
              name: profile.name,
            };
            
            // Check if user role matches the layout
            if (userProfile.role === userRole) {
              setUser(userProfile);
              // Redirect if they land on the wrong dashboard
              const expectedPath = `/${userProfile.role}/`;
              if (!pathname.startsWith(expectedPath) && pathname !== '/_next/static/chunks/main-app.js') { // Added check to prevent irrelevant redirects
                 router.push(`${expectedPath}dashboard`);
              }
            } else {
              // Role mismatch, sign them out and redirect
              await supabase.auth.signOut();
              setUser(null);
              router.push('/');
            }
          } else {
            // No profile found for logged-in user, sign them out
            await supabase.auth.signOut();
            setUser(null);
            router.push('/');
          }
        } else {
          // User is not logged in
          setUser(null);
          if (pathname !== '/') {
            router.push('/');
          }
        }
        setAuthChecked(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, [router, pathname, userRole]);


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
  
  // If auth is checked but there's no user, and we are not on the login page, it means we should not render the shell
  if (!user && pathname !== '/') {
    return null; // or a redirecting message
  }

  // If we are on the login page, just render the children (the AuthForm)
  if (pathname === '/') {
      return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-2">
        </SidebarHeader>
        <SidebarContent>
          {sidebar}
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset> 
        <AppHeaderContent user={user} appName={appName} />
        <main className="flex-1 p-4 sm:p-6 space-y-6 bg-background">
          {children}
        </main>
        <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t">
          <p>&copy; {currentYear} {appName}. All rights reserved.</p>
          <p>Developed by Daniel Temesgen</p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
