
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  getCustomers, 
  subscribeToCustomers,
  initializeCustomers,
  approveCustomer,
  rejectCustomer,
  getBranches,
  initializeBranches,
  subscribeToBranches
} from "@/lib/data-store";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import type { StaffMember } from "../staff-management/staff-types";
import type { Branch } from "../branches/branch-types";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Check, Frown, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { ApprovalTable } from "./approval-table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function ApprovalsPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<StaffMember | null>(null);
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);

  React.useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }

    setIsLoading(true);
    Promise.all([
      initializeCustomers(),
      initializeBranches()
    ]).then(() => {
      setCustomers(getCustomers());
      setBranches(getBranches());
      setIsLoading(false);
    });

    const unsubscribeCustomers = subscribeToCustomers(setCustomers);
    const unsubscribeBranches = subscribeToBranches(setBranches);

    return () => {
      unsubscribeCustomers();
      unsubscribeBranches();
    };
  }, []);

  const pendingCustomers = React.useMemo(() => {
    const allPending = customers.filter(c => c.status === 'Pending Approval');
    
    // Admins see all. Staff Management sees only their branch's customers.
    if (currentUser?.role.toLowerCase() === 'staff management' && currentUser.branchId) {
      const branchId = currentUser.branchId;
      return allPending.filter(c => c.branchId === branchId);
    }
    
    // Default to all pending for Admins or if branch logic doesn't apply
    return allPending;
  }, [customers, currentUser]);
  
  const handleApproveClick = (customer: IndividualCustomer) => {
    setSelectedCustomer(customer);
    setActionType('approve');
  };
  
  const handleRejectClick = (customer: IndividualCustomer) => {
    setSelectedCustomer(customer);
    setActionType('reject');
  };

  const confirmAction = async () => {
    if (!selectedCustomer || !actionType || !currentUser) return;
    
    let result;
    if (actionType === 'approve') {
      result = await approveCustomer(selectedCustomer.customerKeyNumber, currentUser.id);
    } else {
      result = await rejectCustomer(selectedCustomer.customerKeyNumber, currentUser.id);
    }

    if (result.success) {
      toast({
        title: `Customer ${actionType === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Customer ${selectedCustomer.name} has been successfully ${actionType === 'approve' ? 'activated' : 'rejected'}.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: result.message || "An unexpected error occurred."
      });
    }
    
    // Close dialog
    setSelectedCustomer(null);
    setActionType(null);
  };
  
  if (!hasPermission('customers_approve')) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Customer Approvals</h1>
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <CardDescription>You do not have permission to approve or reject customer records.</CardDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck className="h-8 w-8 text-primary"/>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Customer Approvals</h1>
          <p className="text-muted-foreground">Review and approve or reject new customer registrations.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
          <CardDescription>
            The following customers have been added by staff and are awaiting your approval to become active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading pending customers...
             </div>
          ) : pendingCustomers.length === 0 ? (
             <div className="mt-4 p-8 border-2 border-dashed rounded-lg bg-muted/50 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">All Clear!</h3>
                <p className="text-muted-foreground mt-1">There are no pending customer approvals at this time.</p>
             </div>
          ) : (
            <ApprovalTable 
              data={pendingCustomers} 
              branches={branches}
              onApprove={handleApproveClick}
              onReject={handleRejectClick}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action: {actionType === 'approve' ? 'Approve' : 'Reject'} Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} the customer "{selectedCustomer?.name}"?
              {actionType === 'approve' && " This will make their account active and billable."}
              {actionType === 'reject' && " This will mark their record as rejected and it will not be active."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)}>Cancel</AlertDialogCancel>
            <Button 
                onClick={confirmAction}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {actionType === 'approve' ? <Check className="mr-2 h-4 w-4" /> : <Frown className="mr-2 h-4 w-4" />}
              {actionType === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
