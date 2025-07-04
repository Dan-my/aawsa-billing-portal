
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
import type { DomainNotification, DomainBranch } from "@/lib/data-store";

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
  const [branches, setBranches] = React.useState<DomainBranch[]>([]);
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
    if (!user || user.role.toLowerCase() !== 'staff' || !user.branchName || branches.length === 0) {
      return [];
    }

    // A robust function to find the official branch from the user's potentially messy profile branch name.
    const findOfficialBranch = (userBranchName: string, allBranches: DomainBranch[]): DomainBranch | undefined => {
        // Normalize by making lowercase, removing all punctuation and spaces, and removing "branch" suffix
        const normalize = (name: string) => name.toLowerCase().replace(/[.\s]/g, '').replace(/branch$/, '');
        const normalizedUserBranchName = normalize(userBranchName);
        
        for (const branch of allBranches) {
            const normalizedOfficialName = normalize(branch.name);
            if (normalizedOfficialName === normalizedUserBranchName) {
                return branch;
            }
        }
        return undefined;
    };

    const staffOfficialBranch = findOfficialBranch(user.branchName, branches);

    return notifications
      .filter(n => {
        // Case 1: Notification is for "All Staff"
        if (n.targetBranchName.toLowerCase() === 'all staff') {
          return true;
        }
        
        // Case 2: Notification is for the user's specific branch
        // Only proceed if we could identify the user's official branch
        if (staffOfficialBranch) {
            // Compare the notification's target name directly with the user's official branch name.
            // This is robust because the target name is set from the official list when the admin sends it.
            if (n.targetBranchName === staffOfficialBranch.name) {
                return true;
            }
        }

        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
                     Sent by {selectedNotification.senderName} to {selectedNotification.targetBranchName} &bull; {formatDistanceToNow(parseISO(selectedNotification.createdAt), { addSuffix: true })}
                 </DialogDescription>
             </DialogHeader>
             <div className="py-4 text-sm">{selectedNotification.message}</div>
         </DialogContent>
      )}
    </Dialog>
  );
}
