
"use client";

import * as React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, CircleAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  initializeNotifications,
  subscribeToNotifications,
  getBranches,
  initializeBranches,
  subscribeToBranches,
} from "@/lib/data-store";
import type { DomainNotification } from "@/lib/data-store";
import type { Branch } from "@/app/admin/branches/branch-types";

const LAST_READ_TIMESTAMP_KEY = "last-read-timestamp";

interface UserProfile {
  id: string;
  role: string;
  branchName?: string;
  branchId?: string;
  name?: string;
}

interface NotificationBellProps {
  user: UserProfile | null;
}

export function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = React.useState<DomainNotification[]>([]);
  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = React.useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = React.useState<DomainNotification | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setLastReadTimestamp(localStorage.getItem(LAST_READ_TIMESTAMP_KEY));
    }
    initializeNotifications();
    initializeBranches();
    
    const unsubNotifications = subscribeToNotifications(setNotifications);
    const unsubBranches = subscribeToBranches(setAllBranches);

    return () => {
      unsubNotifications();
      unsubBranches();
    };
  }, []);

  const relevantNotifications = React.useMemo(() => {
    if (!user) {
        return [];
    }
    const userRole = user.role.toLowerCase();

    // Admins do not see the notification bell.
    if (userRole === 'admin') {
        return [];
    }

    // Head Office Management sees only global notifications.
    if (userRole === 'head office management') {
        return notifications
            .filter(notification => notification.targetBranchId === null)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Staff and Staff Management see global and their branch-specific notifications.
    const staffBranchId = user.branchId;
    if (userRole === 'staff' || userRole === 'staff management') {
        return notifications
          .filter(notification => {
            // Show if targeted to 'All Staff'
            if (notification.targetBranchId === null) {
                return true;
            }
            // Show if targeted to the user's specific branch
            if (staffBranchId && notification.targetBranchId === staffBranchId) {
                return true;
            }
            return false;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Default case for any other roles.
    return [];
  }, [notifications, user]);

  React.useEffect(() => {
    const newUnreadCount = relevantNotifications.filter(
      (n) => !lastReadTimestamp || new Date(n.createdAt) > new Date(lastReadTimestamp)
    ).length;
    setUnreadCount(newUnreadCount);
  }, [relevantNotifications, lastReadTimestamp]);

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      const newTimestamp = new Date().toISOString();
      localStorage.setItem(LAST_READ_TIMESTAMP_KEY, newTimestamp);
      setLastReadTimestamp(newTimestamp);
      setUnreadCount(0);
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
      if (!isOpen) {
          setSelectedNotification(null);
      }
  };
  
  const getDisplayTargetName = (targetId: string | null) => {
    if (targetId === null) return "All Staff";
    return allBranches.find(b => b.id === targetId)?.name || `Branch ID: ${targetId}`;
  };

  if (!user || user.role.toLowerCase() === 'admin') return null;

  return (
    <Dialog open={!!selectedNotification} onOpenChange={handleDialogChange}>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[350px]">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[300px]">
            {relevantNotifications.length > 0 ? (
              relevantNotifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                  onSelect={() => setSelectedNotification(n)}
                >
                  <div className="flex justify-between w-full">
                    <p className="font-semibold text-sm truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground w-full truncate">{n.message}</p>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <CircleAlert className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedNotification && (
         <DialogContent>
             <DialogHeader>
                 <DialogTitle>{selectedNotification.title}</DialogTitle>
                 <DialogDescription className="text-xs pt-2">
                     Sent by {selectedNotification.senderName} to {getDisplayTargetName(selectedNotification.targetBranchId)} &bull; {formatDistanceToNow(parseISO(selectedNotification.createdAt), { addSuffix: true })}
                 </DialogDescription>
             </DialogHeader>
             <div className="py-4 text-sm">{selectedNotification.message}</div>
         </DialogContent>
      )}
    </Dialog>
  );
}
