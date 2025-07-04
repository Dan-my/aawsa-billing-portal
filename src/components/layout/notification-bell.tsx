
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
} from "@/lib/data-store";
import type { DomainNotification } from "@/lib/data-store";

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
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = React.useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = React.useState<DomainNotification | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setLastReadTimestamp(localStorage.getItem(LAST_READ_TIMESTAMP_KEY));
    }
    initializeNotifications();
    const unsubscribe = subscribeToNotifications(setNotifications);
    return () => unsubscribe();
  }, []);

  const relevantNotifications = React.useMemo(() => {
    if (!user || !user.role) {
      return [];
    }
    
    // Admins see all notifications
    if (user.role.toLowerCase() === 'admin') {
      return notifications;
    }
    
    // Staff see notifications targeted to them or "All Staff"
    if (user.role.toLowerCase() === 'staff') {
      const staffBranch = user.branchName?.trim().toLowerCase();
      
      // Helper function to normalize strings for comparison
      const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');

      return notifications.filter(n => {
        if (!n || !n.targetBranchName) return false;
        
        const targetBranch = n.targetBranchName.trim().toLowerCase();
        
        // Always show "All Staff" notifications
        if (targetBranch === 'all staff') {
          return true;
        }
        
        if (!staffBranch) {
            return false;
        }

        // Normalize both strings to handle variations like "Megenagna" vs "Megenagna Branch"
        const normalizedStaffBranch = normalize(staffBranch);
        const normalizedTargetBranch = normalize(targetBranch);

        // Check if one normalized string contains the other
        if (normalizedTargetBranch.includes(normalizedStaffBranch) || normalizedStaffBranch.includes(normalizedTargetBranch)) {
            return true;
        }

        return false;
      });
    }

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

      {/* The Dialog Content for viewing a single notification */}
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
