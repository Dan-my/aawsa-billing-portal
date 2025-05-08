
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
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';


export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
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
  const IconComponent = item.icon;
  const { state: sidebarState } = useSidebar();
  const isActive = item.matcher ? item.matcher(pathname, item.href) : pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`) && (pathname.length === item.href.length || pathname[item.href.length] === '/'));


  return (
    <Link href={item.href} passHref legacyBehavior>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        disabled={item.disabled}
        className={cn(
          "w-full justify-start",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground",
          !isActive && "hover:bg-sidebar-accent/50"
        )}
        tooltip={sidebarState === 'collapsed' ? item.title : undefined}
      >
        <a target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined}>
          {IconComponent && <IconComponent className="h-5 w-5" />}
          <span className={cn("truncate", sidebarState === 'collapsed' && 'sr-only')}>{item.title}</span>
          {item.label && sidebarState === 'expanded' && <span className="ml-auto text-xs text-muted-foreground">{item.label}</span>}
        </a>
      </SidebarMenuButton>
    </Link>
  );
}

function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const IconComponent = item.icon;
  const { state: sidebarState } = useSidebar();

  const isChildActiveRecursive = (items: NavItem[]): boolean => {
    return items.some(subItem => {
      const isActiveDirectly = subItem.matcher ? subItem.matcher(pathname, subItem.href) : (pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(`${subItem.href}/`) && (pathname.length === subItem.href.length || pathname[subItem.href.length] === '/')));
      if (isActiveDirectly) return true;
      if (subItem.items) return isChildActiveRecursive(subItem.items);
      return false;
    });
  };
  
  const isChildActive = item.items ? isChildActiveRecursive(item.items) : false;
  const isDirectlyActive = (item.href !== '/' && pathname.startsWith(`${item.href}/`) && (pathname.length === item.href.length || pathname[item.href.length] === '/'));
  const isParentActive = isChildActive || isDirectlyActive;

  const [isOpen, setIsOpen] = React.useState(isParentActive);

  React.useEffect(() => {
    if (sidebarState === 'collapsed') {
      setIsOpen(false); 
    } else if (isParentActive && !isOpen) {
      setIsOpen(true); 
    }
  }, [pathname, isParentActive, isOpen, sidebarState]);


  return (
    <>
      <SidebarMenuButton
        onClick={() => {
            if (sidebarState === 'expanded') setIsOpen(!isOpen);
        }}
        isActive={isParentActive && !isOpen}
        className={cn(
            "w-full justify-start", 
            isParentActive && !isOpen && "bg-sidebar-accent/70 text-sidebar-accent-foreground hover:bg-sidebar-accent/60",
            isOpen && sidebarState === 'expanded' && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
        )}
        tooltip={sidebarState === 'collapsed' ? item.title : undefined}
      >
        {IconComponent && <IconComponent className="h-5 w-5" />}
        <span className={cn("truncate", sidebarState === 'collapsed' && 'sr-only')}>{item.title}</span>
        {sidebarState === 'expanded' && (isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />)}
      </SidebarMenuButton>
      {isOpen && sidebarState === 'expanded' && item.items && (
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.href}>
              <Link href={subItem.href} passHref legacyBehavior>
                <SidebarMenuSubButton
                    asChild
                    isActive={subItem.matcher ? subItem.matcher(pathname, subItem.href) : (pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(`${subItem.href}/`) && (pathname.length === subItem.href.length || pathname[subItem.href.length] === '/')))}
                    className={cn(
                        (subItem.matcher ? subItem.matcher(pathname, subItem.href) : (pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(`${subItem.href}/`) && (pathname.length === subItem.href.length || pathname[subItem.href.length] === '/')))) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent/90"
                    )}
                >
                  <a>
                    {subItem.icon && <subItem.icon className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                    {subItem.title}
                  </a>
                </SidebarMenuSubButton>
              </Link>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </>
  );
}


export function SidebarNav({ items, className }: SidebarNavProps) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();

  if (!items?.length) {
    return null;
  }

  return (
    <nav className={cn('flex flex-col gap-1 px-2', className)}>
      {items.map((group, index) => (
        <SidebarGroup key={group.title || index} className="p-0">
          {group.title && (
            <SidebarGroupLabel className={cn(sidebarState === 'collapsed' ? 'hidden' : 'px-2 py-1 text-xs font-semibold text-sidebar-foreground/70', 'transition-opacity duration-200')}>
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
