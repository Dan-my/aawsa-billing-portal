import type { ReactNode } from "react";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the new client-side wrapper for the admin layout.
// This keeps the initial layout chunk minimal to prevent loading errors.
const AdminLayoutClient = dynamic(() => import('@/app/admin/admin-layout-client'), {
  ssr: false,
  loading: () => (
     <div className="flex items-center justify-center h-screen">
       <Skeleton className="h-16 w-16 rounded-full" />
     </div>
  ),
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
