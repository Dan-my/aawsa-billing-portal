
"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { 
    getRoles, initializeRoles, subscribeToRoles,
    getPermissions, initializePermissions, subscribeToPermissions,
    getRolePermissions, initializeRolePermissions, subscribeToRolePermissions,
    updateRolePermissions
} from "@/lib/data-store";
import type { DomainRole, DomainPermission, DomainRolePermission } from "@/lib/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


interface PermissionGroup {
  [category: string]: DomainPermission[];
}

export default function RolesAndPermissionsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [roles, setRoles] = React.useState<DomainRole[]>([]);
  const [permissions, setPermissions] = React.useState<DomainPermission[]>([]);
  const [rolePermissions, setRolePermissions] = React.useState<DomainRolePermission[]>([]);
  
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<number>>(new Set());

  const [isSaving, setIsSaving] = React.useState(false);
  
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        initializeRoles(),
        initializePermissions(),
        initializeRolePermissions()
      ]);
      setRoles(getRoles());
      setPermissions(getPermissions());
      setRolePermissions(getRolePermissions());
      setIsLoading(false);
    };
    fetchData();

    const unsubRoles = subscribeToRoles(setRoles);
    const unsubPerms = subscribeToPermissions(setPermissions);
    const unsubRolePerms = subscribeToRolePermissions(setRolePermissions);

    return () => {
      unsubRoles();
      unsubPerms();
      unsubRolePerms();
    };
  }, []);

  React.useEffect(() => {
    if (selectedRoleId) {
      const roleIdNum = parseInt(selectedRoleId, 10);
      const permissionsForRole = rolePermissions
        .filter(rp => rp.role_id === roleIdNum)
        .map(rp => rp.permission_id);
      setSelectedPermissions(new Set(permissionsForRole));
    } else {
      setSelectedPermissions(new Set());
    }
  }, [selectedRoleId, rolePermissions]);

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedRoleId) {
      toast({ variant: "destructive", title: "No Role Selected", description: "Please select a role to update." });
      return;
    }
    
    setIsSaving(true);
    const roleIdNum = parseInt(selectedRoleId, 10);
    const permissionIds = Array.from(selectedPermissions);

    const result = await updateRolePermissions(roleIdNum, permissionIds);

    if (result.success) {
      const selectedRole = roles.find(r => r.id === roleIdNum);
      toast({ title: "Permissions Updated", description: `Permissions for the role "${selectedRole?.role_name}" have been saved.` });
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.message || "An unexpected error occurred." });
    }
    setIsSaving(false);
  };

  const groupedPermissions = React.useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const category = permission.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as PermissionGroup);
  }, [permissions]);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold">Roles & Permissions</h1>
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Roles & Permissions</h1>
        <Card>
            <CardHeader>
                <CardTitle>Manage Role Privileges</CardTitle>
                <CardDescription>Select a role to view and edit its assigned permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="role-select">Select a Role</Label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                        <SelectTrigger id="role-select" className="w-full md:w-[300px]">
                            <SelectValue placeholder="Choose a role to manage..." />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role.id} value={String(role.id)}>{role.role_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {selectedRoleId && (
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Permissions for {roles.find(r => r.id.toString() === selectedRoleId)?.role_name}
                        </h3>
                        <Accordion type="multiple" defaultValue={Object.keys(groupedPermissions)} className="w-full">
                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                                <AccordionItem key={category} value={category}>
                                    <AccordionTrigger>{category}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {perms.map(perm => (
                                                <div key={perm.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`perm-${perm.id}`}
                                                        checked={selectedPermissions.has(perm.id)}
                                                        onCheckedChange={(checked) => handlePermissionToggle(perm.id, checked as boolean)}
                                                    />
                                                    <label
                                                        htmlFor={`perm-${perm.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {perm.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
