
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Search, UploadCloud, AlertCircle, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddMeterReadingForm, type AddMeterReadingFormValues } from "@/components/add-meter-reading-form";
import MeterReadingsTable from "@/components/meter-readings-table";
import { useToast } from "@/hooks/use-toast";
import { 
  addIndividualCustomerReading,
  addBulkMeterReading,
  getCustomers, 
  initializeCustomers, 
  getBulkMeters, 
  initializeBulkMeters,
  getIndividualCustomerReadings,
  initializeIndividualCustomerReadings,
  subscribeToIndividualCustomerReadings,
  getBulkMeterReadings,
  initializeBulkMeterReadings,
  subscribeToBulkMeterReadings,
  getBranches,
} from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { DisplayReading } from "@/lib/data-store";
import { format } from "date-fns";
import { CsvReadingUploadDialog } from "@/components/csv-reading-upload-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TablePagination } from "@/components/ui/table-pagination";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


interface User {
  id?: string;
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffMeterReadingsPage() {
  const { toast } = useToast();
  const [branchName, setBranchName] = React.useState<string>("Your Branch");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isIndividualCsvModalOpen, setIsIndividualCsvModalOpen] = React.useState(false);
  const [isBulkCsvModalOpen, setIsBulkCsvModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  
  const [individualReadings, setIndividualReadings] = React.useState<DisplayReading[]>([]);
  const [bulkReadings, setBulkReadings] = React.useState<DisplayReading[]>([]);
  
  const [customersForForm, setCustomersForForm] = React.useState<IndividualCustomer[]>([]);
  const [bulkMetersForForm, setBulkMetersForForm] = React.useState<BulkMeter[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState(""); 

  const [individualPage, setIndividualPage] = React.useState(0);
  const [individualRowsPerPage, setIndividualRowsPerPage] = React.useState(10);
  const [bulkPage, setBulkPage] = React.useState(0);
  const [bulkRowsPerPage, setBulkRowsPerPage] = React.useState(10);


  const combineAndSortReadings = React.useCallback((currentBranchName?: string) => {
    const allCustomers = getCustomers();
    const allBulkMeters = getBulkMeters();
    const allIndividualReadings = getIndividualCustomerReadings();
    const allBulkReadings = getBulkMeterReadings();

    const simpleBranchName = currentBranchName ? currentBranchName.replace(/ Branch$/i, "").toLowerCase().trim() : undefined;

    const branchBulkMeters = simpleBranchName ? allBulkMeters.filter(bm => (bm.location?.toLowerCase() || "").includes(simpleBranchName) || (bm.name?.toLowerCase() || "").includes(simpleBranchName) || (bm.branchId && getBranches().find(b => b.id === bm.branchId)?.name.toLowerCase().includes(simpleBranchName))) : [];
    const branchCustomers = simpleBranchName ? allCustomers.filter(c => (c.location?.toLowerCase() || "").includes(simpleBranchName) || (c.assignedBulkMeterId && branchBulkMeters.some(bm => bm.id === c.assignedBulkMeterId)) || (c.branchId && getBranches().find(b => b.id === c.branchId)?.name.toLowerCase().includes(simpleBranchName))) : [];

    setBulkMetersForForm(branchBulkMeters);
    setCustomersForForm(branchCustomers);

    const displayedIndividualReadings: DisplayReading[] = allIndividualReadings
      .filter(r => branchCustomers.some(c => c.id === r.individualCustomerId))
      .map(r => ({
        id: r.id,
        meterId: r.individualCustomerId,
        meterType: 'individual',
        meterIdentifier: allCustomers.find(c => c.id === r.individualCustomerId)?.name || `Cust ID ${r.individualCustomerId}`,
        readingValue: r.readingValue, readingDate: r.readingDate, monthYear: r.monthYear, notes: r.notes
      })).sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());

    const displayedBulkReadings: DisplayReading[] = allBulkReadings
      .filter(r => branchBulkMeters.some(bm => bm.id === r.bulkMeterId))
      .map(r => ({
        id: r.id,
        meterId: r.bulkMeterId,
        meterType: 'bulk',
        meterIdentifier: allBulkMeters.find(bm => bm.id === r.bulkMeterId)?.name || `BM ID ${r.bulkMeterId}`,
        readingValue: r.readingValue, readingDate: r.readingDate, monthYear: r.monthYear, notes: r.notes
      })).sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
    
    setIndividualReadings(displayedIndividualReadings);
    setBulkReadings(displayedBulkReadings);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("user");
    let localBranchName: string | undefined;

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (isMounted) {
            setCurrentUser(parsedUser);
            if (parsedUser.role === "staff" && parsedUser.branchName) {
              setBranchName(parsedUser.branchName);
              localBranchName = parsedUser.branchName;
            }
        }
      } catch (e) { console.error("Failed to parse user from localStorage", e); }
    }

    setIsLoading(true);
    Promise.all([
      initializeCustomers(),
      initializeBulkMeters(),
      initializeIndividualCustomerReadings(),
      initializeBulkMeterReadings(),
    ]).then(() => {
      if (!isMounted) return;
      combineAndSortReadings(localBranchName);
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing data:", error);
      toast({ title: "Error Loading Data", variant: "destructive" });
      setIsLoading(false);
    });
    
    const unsubIndiReadings = subscribeToIndividualCustomerReadings(() => { if(isMounted) combineAndSortReadings(localBranchName); });
    const unsubBulkReadings = subscribeToBulkMeterReadings(() => { if(isMounted) combineAndSortReadings(localBranchName); });
    
    return () => { isMounted = false; unsubIndiReadings(); unsubBulkReadings(); };
  }, [toast, combineAndSortReadings]);


  const handleAddReadingSubmit = async (formData: AddMeterReadingFormValues) => {
    if (!currentUser?.id) {
      toast({ variant: "destructive", title: "Error", description: "User information not found." });
      return;
    }
    
    const { entityId, meterType, reading, date } = formData;
    
    setIsLoading(true);
    let result;

    try {
      if (meterType === 'individual_customer_meter') {
        result = await addIndividualCustomerReading({
          individualCustomerId: entityId,
          readerStaffId: currentUser.id,
          readingDate: format(date, "yyyy-MM-dd"),
          monthYear: format(date, "yyyy-MM"),
          readingValue: reading,
          notes: `Reading by ${currentUser.email}`,
        });
      } else {
        result = await addBulkMeterReading({
          bulkMeterId: entityId,
          readerStaffId: currentUser.id,
          readingDate: format(date, "yyyy-MM-dd"),
          monthYear: format(date, "yyyy-MM"),
          readingValue: reading,
          notes: `Reading by ${currentUser.email}`,
        });
      }

      if (result.success) {
        toast({ title: "Meter Reading Added", description: `Reading has been recorded.` });
        setIsModalOpen(false);
      } else {
        toast({ variant: "destructive", title: "Submission Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Error", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const filteredIndividualReadings = individualReadings.filter(reading => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return reading.meterIdentifier.toLowerCase().includes(lowerSearchTerm) ||
           String(reading.readingValue).includes(lowerSearchTerm);
  });
  
  const paginatedIndividualReadings = filteredIndividualReadings.slice(
    individualPage * individualRowsPerPage,
    individualPage * individualRowsPerPage + individualRowsPerPage
  );
  
  const filteredBulkReadings = bulkReadings.filter(reading => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return reading.meterIdentifier.toLowerCase().includes(lowerSearchTerm) ||
           String(reading.readingValue).includes(lowerSearchTerm);
  });

  const paginatedBulkReadings = filteredBulkReadings.slice(
    bulkPage * bulkRowsPerPage,
    bulkPage * bulkRowsPerPage + bulkRowsPerPage
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Meter Readings ({branchName})</h1>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search readings..." 
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isLoading && (customersForForm.length === 0 && bulkMetersForForm.length === 0)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Reading
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Add New Reading</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsModalOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Manual Entry</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsIndividualCsvModalOpen(true)}>
                <UploadCloud className="mr-2 h-4 w-4" />
                <span>Upload Individual (CSV)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsBulkCsvModalOpen(true)}>
                <UploadCloud className="mr-2 h-4 w-4" />
                <span>Upload Bulk (CSV)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Tabs defaultValue="individual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual Readings ({filteredIndividualReadings.length})</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Meter Readings ({filteredBulkReadings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="individual">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Individual Customer Reading List</CardTitle>
                <CardDescription>View and manage readings for individual customers in your branch.</CardDescription>
              </CardHeader>
              <CardContent>
                 {isLoading && paginatedIndividualReadings.length === 0 ? (
                    <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                        Loading readings...
                    </div>
                 ) : (
                    <MeterReadingsTable data={paginatedIndividualReadings} />
                 )}
              </CardContent>
              {filteredIndividualReadings.length > 0 && (
                 <TablePagination
                    count={filteredIndividualReadings.length}
                    page={individualPage}
                    rowsPerPage={individualRowsPerPage}
                    onPageChange={setIndividualPage}
                    onRowsPerPageChange={(value) => {
                        setIndividualRowsPerPage(value);
                        setIndividualPage(0);
                    }}
                 />
              )}
            </Card>
          </TabsContent>
          <TabsContent value="bulk">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bulk Meter Reading List</CardTitle>
                <CardDescription>View and manage readings for bulk meters in your branch.</CardDescription>
              </CardHeader>
              <CardContent>
                 {isLoading && paginatedBulkReadings.length === 0 ? (
                    <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                        Loading readings...
                    </div>
                 ) : (
                    <MeterReadingsTable data={paginatedBulkReadings} />
                 )}
              </CardContent>
              {filteredBulkReadings.length > 0 && (
                 <TablePagination
                    count={filteredBulkReadings.length}
                    page={bulkPage}
                    rowsPerPage={bulkRowsPerPage}
                    onPageChange={setBulkPage}
                    onRowsPerPageChange={(value) => {
                        setBulkRowsPerPage(value);
                        setBulkPage(0);
                    }}
                 />
              )}
            </Card>
          </TabsContent>
      </Tabs>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <UIDialogTitle>Add New Meter Reading</UIDialogTitle>
            <UIDialogDescription>
              Select the meter type, then the specific meter, and enter the reading details.
            </UIDialogDescription>
          </DialogHeader>
          {(isLoading && (customersForForm.length === 0 && bulkMetersForForm.length === 0)) ? <p>Loading meter data...</p> : (
            (!isLoading && customersForForm.length === 0 && bulkMetersForForm.length === 0) ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Meters Found</AlertTitle>
                    <UIAlertDescription>
                        No customers or bulk meters could be loaded for your branch ({branchName}) to add readings. Please check if data exists or contact an administrator.
                    </UIAlertDescription>
                </Alert>
            ) : (
                <AddMeterReadingForm 
                    onSubmit={handleAddReadingSubmit} 
                    customers={customersForForm}
                    bulkMeters={bulkMetersForForm}
                    isLoading={isLoading}
                />
            )
          )}
        </DialogContent>
      </Dialog>
      
      <CsvReadingUploadDialog
        open={isIndividualCsvModalOpen}
        onOpenChange={setIsIndividualCsvModalOpen}
        meterType="individual"
        meters={customersForForm}
        currentUser={currentUser}
      />
      <CsvReadingUploadDialog
        open={isBulkCsvModalOpen}
        onOpenChange={setIsBulkCsvModalOpen}
        meterType="bulk"
        meters={bulkMetersForForm}
        currentUser={currentUser}
      />
    </div>
  );
}
