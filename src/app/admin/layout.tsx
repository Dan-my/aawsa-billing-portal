
import type { ReactNode } from "react";
import { AdminLayoutContent } from "./layout-content";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
