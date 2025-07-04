
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
  role: 'Admin' | 'Staff';
  branchName?: string;
  name?: string;
}

interface NotificationBellProps {
  user: UserProfile | null;
}

export function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = React.useState<DomainNotification[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
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
    const unsubBranches = subscribeToBranches(setBranches);

    return () => {
      unsubNotifications();
      unsubBranches();
    };
  }, []);

  const relevantNotifications = React.useMemo(() => {
    if (!user || !user.role) {
      return [];
    }
    
    if (user.role.toLowerCase() === 'admin') {
      return notifications;
    }
    
    if (user.role.toLowerCase() === 'staff') {
      const userBranchName = user.branchName?.trim().toLowerCase();
      
      // Find the user's canonical branch object from the central list.
      const userBranch = userBranchName 
        ? branches.find(b => b.name.trim().toLowerCase() === userBranchName) 
        : null;

      return notifications.filter(n => {
        if (!n || !n.targetBranchName) return false;
        
        const targetBranchName = n.targetBranchName.trim().toLowerCase();
        
        // Case 1: Notification is for "All Staff".
        if (targetBranchName === 'all staff') {
          return true;
        }
        
        // Case 2: Notification is for the user's specific branch.
        // We look up the target branch object from the central list.
        const targetBranch = branches.find(b => b.name.trim().toLowerCase() === targetBranchName);

        // If both the user's branch and the notification's target branch
        // were found in the master list, we can reliably compare their IDs.
        if (userBranch && targetBranch) {
          return userBranch.id === targetBranch.id;
        }

        // Fallback for cases where IDs might not be available
        return userBranchName === targetBranchName;
      });
    }

    return [];
  }, [notifications, user, branches]);

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

  if (!user) return null;

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
                     Sent by {selectedNotification.senderName} to {selectedNotification.targetBranchName} &bull; {formatDistanceToNow(parseISO(selectedNotification.createdAt), { addSuffix: true })}
                 </DialogDescription>
             </DialogHeader>
             <div className="py-4 text-sm">{selectedNotification.message}</div>
         </DialogContent>
      )}
    </Dialog>
  );
}
