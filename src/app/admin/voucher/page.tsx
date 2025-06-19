
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function VoucherPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center">
        <Ticket className="mr-3 h-8 w-8 text-primary" /> Voucher Management
      </h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Voucher System</CardTitle>
          <CardDescription>
            Manage and track voucher information. This section is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-lg">
              Voucher functionality will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
