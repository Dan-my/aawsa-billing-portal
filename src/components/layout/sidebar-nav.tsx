'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as icons from 'lucide-react'; 
import type { LucideProps } from 'lucide-react'; 
import * as React from 'react';


export interface NavItem {
  title: string;
  href: string;
  iconName?: keyof typeof icons; 
  disabled?: boolean;
  external?: boolean;
  label?: string;
  items?: NavItem[];
  matcher?: (pathname: string, href: string) => boolean;
}

export interface NavItemGroup {
  title?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  items: NavItemGroup[];
  className?: string;
}

function NavItemLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const IconComponent = item.iconName ? icons[item.iconName] : null;
  const { state: sidebarState, isMobile } = useSidebar();
  const currentDisplayState = isMobile ? (sidebarState === "mobile" ? "expanded" : "collapsed") : sidebarState;

  const isActive = item.matcher ? item.matcher(pathname, item.href) : pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`) && (pathname.length === item.href.length || pathname[item.href.length] === '/'));


  return (
    <Link href={item.href} asChild>
      <SidebarMenuButton
        isActive={isActive}
        disabled={item.disabled}
        className={cn(
          "w-full justify-start",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground",
          !isActive && "hover:bg-sidebar-accent/50"
        )}
        tooltip={currentDisplayState === 'collapsed' && !isMobile ? item.title : undefined}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
      >
        {IconComponent && <IconComponent className="h-5 w-5" />}
        <span className={cn("truncate", currentDisplayState === 'collapsed' && !isMobile && 'sr-only')}>{item.title}</span>
        {item.label && currentDisplayState === 'expanded' && <span className="ml-auto text-xs text-muted-foreground">{item.label}</span>}
      </SidebarMenuButton>
    </Link>
  );
}

function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const IconComponent = item.iconName ? icons[item.iconName] : null; 
  const { state: sidebarState, isMobile } = useSidebar();
  const currentDisplayState = isMobile ? (sidebarState === "mobile" ? "expanded" : "collapsed") : sidebarState;


  const isChildActiveRecursive = (items: NavItem[]): boolean => {
    return items.some(subItem => {
      const isActiveDirectly = subItem.matcher ? subItem.matcher(pathname, subItem.href) : (pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(`${subItem.href}/`) && (pathname.length === subItem.href.length || pathname[subItem.href.length] === '/')));
      if (isActiveDirectly) return true;
      if (subItem.items) return isChildActiveRecursive(subItem.items);
      return false;
    });
  };
  
  const isAnyChildActive = item.items ? isChildActiveRecursive(item.items) : false;
  const isParentItemActive = item.matcher ? item.matcher(pathname, item.href) : (pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`) && (pathname.length === item.href.length || pathname[subItem.href.length] === '/')));
  
  const isEffectivelyActive = isAnyChildActive || isParentItemActive;


  const [isOpen, setIsOpen] = React.useState(isEffectivelyActive);

  React.useEffect(() => {
    if (currentDisplayState === 'collapsed' && !isMobile) {
      setIsOpen(false); 
    } else if (isEffectivelyActive && !isOpen && currentDisplayState === 'expanded') { 
      setIsOpen(true); 
    }
  }, [pathname, isEffectivelyActive, isOpen, currentDisplayState, isMobile]);


  return (
    <>
      <SidebarMenuButton
        onClick={() => {
            if (currentDisplayState === 'expanded') setIsOpen(!isOpen);
        }}
        isActive={isEffectivelyActive && !isOpen} 
        className={cn(
            "w-full justify-start", 
            isEffectivelyActive && !isOpen && "bg-sidebar-accent/70 text-sidebar-accent-foreground hover:bg-sidebar-accent/60",
            isOpen && currentDisplayState === 'expanded' && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
        )}
        tooltip={currentDisplayState === 'collapsed' && !isMobile ? item.title : undefined}
      >
        {IconComponent && <IconComponent className="h-5 w-5" />}
        <span className={cn("truncate", currentDisplayState === 'collapsed' && !isMobile && 'sr-only')}>{item.title}</span>
        {currentDisplayState === 'expanded' && (isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />)}
      </SidebarMenuButton>
      {isOpen && currentDisplayState === 'expanded' && item.items && (
        <SidebarMenuSub>
          {item.items.map((subItem) => {
            const SubIconComponent = subItem.iconName ? icons[subItem.iconName as keyof typeof icons] : null;
            const isSubItemActive = subItem.matcher ? subItem.matcher(pathname, subItem.href) : (pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(`${subItem.href}/`) && (pathname.length === subItem.href.length || pathname[subItem.href.length] === '/')));
            return (
              <SidebarMenuSubItem key={subItem.href}>
                <Link href={subItem.href} asChild>
                  <SidebarMenuSubButton
                      isActive={isSubItemActive}
                      className={cn(
                          isSubItemActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent/90"
                      )}
                  >
                    <>
                      {SubIconComponent && <SubIconComponent className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                      {subItem.title}
                    </>
                  </SidebarMenuSubButton>
                </Link>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </>
  );
}


export function SidebarNav({ items, className }: SidebarNavProps) {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const currentDisplayState = isMobile ? (sidebarState === "mobile" ? "expanded" : "collapsed") : sidebarState;


  if (!items?.length) {
    return null;
  }

  return (
    <nav className={cn('flex flex-col gap-1 px-2', className)}>
      {items.map((group, index) => (
        <SidebarGroup key={group.title || index} className="p-0">
          {group.title && (
            <SidebarGroupLabel className={cn(currentDisplayState === 'collapsed' && !isMobile ? 'hidden' : 'px-2 py-1 text-xs font-semibold text-sidebar-foreground/70', 'transition-opacity duration-200')}>
              {group.title}
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                {item.items && item.items.length > 0 ? (
                  <CollapsibleNavItem item={item} pathname={pathname} />
                ) : (
                  <NavItemLink item={item} pathname={pathname} />
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </nav>
  );
}