
"use client";

import * as React from "react"; // Changed from "useState" to "React" for full React API
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Upload, FileText } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndividualCustomerDataEntryForm } from "./individual-customer-data-entry-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BulkMeterDataEntryForm } from "./bulk-meter-data-entry-form";
import { useToast } from "@/hooks/use-toast";

export default function AdminDataEntryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = React.useState("manual");

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#individual-manual" || hash === "#bulk-manual") {
        setActiveMainTab("manual");
        // Scroll to specific card after a short delay to ensure DOM is ready
        setTimeout(() => {
          if (hash === "#individual-manual") {
            document.getElementById("individual-customer-card")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (hash === "#bulk-manual") {
            document.getElementById("bulk-meter-card")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else if (hash === "#csv-upload") {
        setActiveMainTab("csv");
      }
    };

    handleHashChange(); // Initial check
    window.addEventListener('hashchange', handleHashChange, { passive: true });
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  const handleCsvUploadPlaceholder = (type: string) => {
    toast({
      title: "CSV Upload (Coming Soon)",
      description: `Functionality to upload ${type} data via CSV is under development.`,
    });
  };

  const handleTabChange = (value: string) => {
    setActiveMainTab(value);
    let newHash = "";
    if (value === "manual") {
      newHash = "#individual-manual"; // Default to individual when manual tab is clicked
    } else if (value === "csv") {
      newHash = "#csv-upload";
    }
    router.push(`/admin/data-entry${newHash}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Data Entry</h1>
      
      <Tabs value={activeMainTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual"><FileText className="mr-2 h-4 w-4"/> Manual Entry</TabsTrigger>
          <TabsTrigger value="csv"><Upload className="mr-2 h-4 w-4"/> CSV Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg" id="individual-customer-card">
              <CardHeader>
                <CardTitle>Individual Customer Data Entry</CardTitle>
                <CardDescription>Enter new individual customer details and initial meter readings manually.</CardDescription>
              </CardHeader>
              <CardContent><IndividualCustomerDataEntryForm /></CardContent>
            </Card>
            <Card className="shadow-lg" id="bulk-meter-card">
              <CardHeader>
                <CardTitle>Bulk Meter Data Entry</CardTitle>
                <CardDescription>Enter new bulk meter details and initial meter readings manually.</CardDescription>
              </CardHeader>
              <CardContent><BulkMeterDataEntryForm /></CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="csv" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Upload Individual Customer Data (CSV)</CardTitle>
                <CardDescription>Upload a CSV file containing individual customer details and initial meter readings.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Input type="file" accept=".csv" />
                <Button onClick={() => handleCsvUploadPlaceholder("Individual Customers")}>
                  <Upload className="mr-2 h-4 w-4"/> Upload Individual Customers
                </Button>
                 <p className="text-sm text-muted-foreground">Accepted format: CSV</p>
                 <a href="/templates/individual_customer_template.csv" download className="text-sm text-primary hover:underline">Download Template</a>
              </CardContent>
            </Card>
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Upload Bulk Meter Data (CSV)</CardTitle>
                <CardDescription>Upload a CSV file containing bulk meter details and initial meter readings.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                 <Input type="file" accept=".csv" />
                 <Button onClick={() => handleCsvUploadPlaceholder("Bulk Meters")}>
                    <Upload className="mr-2 h-4 w-4"/> Upload Bulk Meters
                 </Button>
                 <p className="text-sm text-muted-foreground">Accepted format: CSV</p>
                 <a href="/templates/bulk_meter_template.csv" download className="text-sm text-primary hover:underline">Download Template</a>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
