
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, Search, UploadCloud, FileSpreadsheet, FileWarning, CheckCircle, Info, AlertCircle } from "lucide-react";
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
  subscribeToCustomers,
  subscribeToBulkMeters
} from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { DisplayReading } from "@/lib/data-store";
import { format, parse, isValid } from "date-fns";
import { z, ZodError } from "zod";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";


interface User {
  id?: string;
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

const readingCsvHeaders = ["meter_number", "reading_value", "reading_date"];
const CSV_SPLIT_REGEX = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;

const readingCsvRowSchema = z.object({
  meter_number: z.string().min(1, { message: "meter_number is required." }),
  reading_value: z.coerce.number().min(0, { message: "reading_value must be a non-negative number." }),
  reading_date: z.string().refine(val => isValid(parse(val, 'yyyy-MM-dd', new Date())), {
    message: "reading_date must be a valid date in YYYY-MM-DD format.",
  }),
});


export default function AdminMeterReadingsPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  
  const [allCustomers, setAllCustomers] = React.useState<IndividualCustomer[]>([]);
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allCombinedReadings, setAllCombinedReadings] = React.useState<DisplayReading[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState(""); 

  // CSV State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [isCsvProcessing, setIsCsvProcessing] = React.useState(false);
  const [csvProcessingErrors, setCsvProcessingErrors] = React.useState<string[]>([]);
  const [csvSuccessCount, setCsvSuccessCount] = React.useState(0);


  const combineAndSortReadings = React.useCallback(() => {
    const individualReadings = getIndividualCustomerReadings();
    const bulkReadings = getBulkMeterReadings();
    const customers = getCustomers();
    const bulkMeters = getBulkMeters();

    const displayedIndividualReadings: DisplayReading[] = individualReadings.map(r => {
        const customer = customers.find(c => c.id === r.individualCustomerId);
        return {
            id: r.id,
            meterId: r.individualCustomerId,
            meterType: 'individual',
            meterIdentifier: customer ? `${customer.name} (M: ${customer.meterNumber})` : `Cust. ID: ${r.individualCustomerId}`,
            readingValue: r.readingValue,
            readingDate: r.readingDate,
            monthYear: r.monthYear,
            notes: r.notes
        };
    });

    const displayedBulkReadings: DisplayReading[] = bulkReadings.map(r => {
        const bulkMeter = bulkMeters.find(bm => bm.id === r.bulkMeterId);
        return {
            id: r.id,
            meterId: r.bulkMeterId,
            meterType: 'bulk',
            meterIdentifier: bulkMeter ? `${bulkMeter.name} (M: ${bulkMeter.meterNumber})` : `BM ID: ${r.bulkMeterId}`,
            readingValue: r.readingValue,
            readingDate: r.readingDate,
            monthYear: r.monthYear,
            notes: r.notes
        };
    });
    
    const combined = [...displayedIndividualReadings, ...displayedBulkReadings];
    combined.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
    setAllCombinedReadings(combined);

  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (isMounted) setCurrentUser(parsedUser);
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
      setAllCustomers(getCustomers());
      setAllBulkMeters(getBulkMeters());
      combineAndSortReadings();
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing data for meter readings page:", error);
      toast({ title: "Error Loading Data", description: "Could not load necessary data.", variant: "destructive" });
      setIsLoading(false);
    });
    
    const unsubCust = subscribeToCustomers((updated) => { if(isMounted) { setAllCustomers(updated); combineAndSortReadings(); }});
    const unsubBM = subscribeToBulkMeters((updated) => { if(isMounted) { setAllBulkMeters(updated); combineAndSortReadings(); }});
    const unsubIndiReadings = subscribeToIndividualCustomerReadings(() => { if(isMounted) combineAndSortReadings(); });
    const unsubBulkReadings = subscribeToBulkMeterReadings(() => { if(isMounted) combineAndSortReadings(); });
    
    return () => { 
        isMounted = false; 
        unsubCust();
        unsubBM();
        unsubIndiReadings();
        unsubBulkReadings();
    };
  }, [toast, combineAndSortReadings]);

  const handleAddReadingSubmit = async (formData: AddMeterReadingFormValues) => {
    const readerId = currentUser?.id; 
    const { entityId, meterType, reading, date } = formData;
    
    setIsLoading(true);
    let result;

    try {
      if (meterType === 'individual_customer_meter') {
        result = await addIndividualCustomerReading({
          individualCustomerId: entityId,
          readerStaffId: readerId,
          readingDate: format(date, "yyyy-MM-dd"),
          monthYear: format(date, "yyyy-MM"),
          readingValue: reading,
          isEstimate: false,
          notes: `Reading entered by ${currentUser?.email || 'Admin'}`,
        });
      } else {
        result = await addBulkMeterReading({
          bulkMeterId: entityId,
          readerStaffId: readerId,
          readingDate: format(date, "yyyy-MM-dd"),
          monthYear: format(date, "yyyy-MM"),
          readingValue: reading,
          isEstimate: false,
          notes: `Reading entered by ${currentUser?.email || 'Admin'}`,
        });
      }

      if (result.success && result.data) {
        toast({
          title: "Meter Reading Added",
          description: `Reading for selected meter has been successfully recorded.`,
        });
        setIsModalOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: result.message || "Could not record meter reading.",
        });
      }
    } catch (error) {
      console.error("Error submitting meter reading:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred while saving the reading.",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setCsvFile(selectedFile);
        setCsvProcessingErrors([]);
        setCsvSuccessCount(0);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a valid .csv file.",
        });
        setCsvFile(null);
         if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleProcessCsvFile = async () => {
    if (!csvFile || !currentUser) return;
    
    setIsCsvProcessing(true);
    let localSuccessCount = 0;
    const localErrors: string[] = [];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        localErrors.push("CSV must contain a header and at least one data row.");
        finalizeProcessing();
        return;
      }

      const headerLine = lines[0].split(CSV_SPLIT_REGEX).map(h => h.trim().replace(/^"|"$/g, ''));
      if (headerLine.length !== readingCsvHeaders.length || !readingCsvHeaders.every((h, i) => h === headerLine[i])) {
         localErrors.push(`Invalid CSV headers. Expected: "${readingCsvHeaders.join(", ")}".`);
         finalizeProcessing();
         return;
      }
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(CSV_SPLIT_REGEX).map(v => v.trim().replace(/^"|"$/g, ''));
        const rowData = Object.fromEntries(headerLine.map((header, index) => [header, values[index]]));

        try {
          const validatedRow = readingCsvRowSchema.parse(rowData);
          const readingDate = parse(validatedRow.reading_date, 'yyyy-MM-dd', new Date());

          let meterFound = false;
          let result: any;
          
          const customer = allCustomers.find(c => c.meterNumber === validatedRow.meter_number);
          if (customer) {
            meterFound = true;
            result = await addIndividualCustomerReading({
              individualCustomerId: customer.id,
              readerStaffId: currentUser.id,
              readingDate: format(readingDate, "yyyy-MM-dd"),
              monthYear: format(readingDate, "yyyy-MM"),
              readingValue: validatedRow.reading_value,
              notes: `CSV Upload by ${currentUser.email}`,
            });
          } else {
            const bulkMeter = allBulkMeters.find(bm => bm.meterNumber === validatedRow.meter_number);
            if (bulkMeter) {
              meterFound = true;
              result = await addBulkMeterReading({
                bulkMeterId: bulkMeter.id,
                readerStaffId: currentUser.id,
                readingDate: format(readingDate, "yyyy-MM-dd"),
                monthYear: format(readingDate, "yyyy-MM"),
                readingValue: validatedRow.reading_value,
                notes: `CSV Upload by ${currentUser.email}`,
              });
            }
          }

          if (!meterFound) {
            localErrors.push(`Row ${i + 1}: Meter number '${validatedRow.meter_number}' not found.`);
          } else if (result && result.success) {
            localSuccessCount++;
          } else {
            localErrors.push(`Row ${i + 1} (${validatedRow.meter_number}): ${result.message || 'Unknown error.'}`);
          }

        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map(issue => `Row ${i + 1}, Column '${issue.path.join('.')}': ${issue.message}`).join("; ");
                localErrors.push(errorMessages);
            } else {
                localErrors.push(`Row ${i + 1}: Unknown validation error. ${(error as Error).message}`);
            }
        }
      }
      finalizeProcessing();
    };

    reader.readAsText(csvFile);

    function finalizeProcessing() {
        setCsvSuccessCount(localSuccessCount);
        setCsvProcessingErrors(localErrors);
        setIsCsvProcessing(false);
        if (localSuccessCount > 0 && localErrors.length === 0) {
            toast({ title: "CSV Processed", description: `${localSuccessCount} readings added successfully.` });
        } else if (localSuccessCount > 0 && localErrors.length > 0) {
            toast({ title: "CSV Partially Processed", description: `${localSuccessCount} readings added. Some rows had errors.` });
        } else if (localErrors.length > 0) {
            toast({ variant: "destructive", title: "CSV Processing Failed", description: `No readings were added. Please check the errors.` });
        }
    }
  };

  const downloadCsvTemplate = () => {
    const csvString = readingCsvHeaders.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "meter_reading_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const displayedReadings = allCombinedReadings.filter(reading => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return reading.meterIdentifier.toLowerCase().includes(lowerSearchTerm) ||
           String(reading.readingValue).includes(lowerSearchTerm) ||
           reading.readingDate.includes(lowerSearchTerm) ||
           reading.monthYear.includes(lowerSearchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Meter Readings Management</h1>
        <div className="flex gap-2 w-full md:w-auto">
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
          <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4" /> Upload Readings CSV</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <UIDialogTitle>Upload Meter Readings via CSV</UIDialogTitle>
                    <UIDialogDescription>
                        Select a CSV file with columns: meter_number, reading_value, reading_date (in YYYY-MM-DD format).
                    </UIDialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleCsvFileChange}
                            className="flex-grow"
                            disabled={isCsvProcessing}
                        />
                        <Button
                            onClick={handleProcessCsvFile}
                            disabled={!csvFile || isCsvProcessing}
                            className="w-full sm:w-auto"
                        >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {isCsvProcessing ? "Processing..." : `Upload`}
                        </Button>
                    </div>
                     {csvSuccessCount > 0 && (
                        <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-300">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertTitle className="text-green-700">Processing Complete</AlertTitle>
                        <UIAlertDescription className="text-green-600">Successfully processed {csvSuccessCount} readings.</UIAlertDescription>
                        </Alert>
                    )}
                    {csvProcessingErrors.length > 0 && (
                        <Alert variant="destructive">
                            <FileWarning className="h-5 w-5" />
                            <AlertTitle>Processing Errors Found</AlertTitle>
                            <UIAlertDescription>
                                <ScrollArea className="mt-2 h-[150px] w-full rounded-md border p-2 bg-background">
                                <ul className="list-disc pl-5 space-y-1 text-xs">{csvProcessingErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>
                                </ScrollArea>
                            </UIAlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={downloadCsvTemplate}><FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading && (allCustomers.length === 0 && allBulkMeters.length === 0)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <UIDialogTitle>Add New Meter Reading</UIDialogTitle>
                <UIDialogDescription>
                  Select the meter type, then the specific meter, and enter the reading details.
                </UIDialogDescription>
              </DialogHeader>
              <AddMeterReadingForm 
                  onSubmit={handleAddReadingSubmit} 
                  customers={allCustomers}
                  bulkMeters={allBulkMeters}
                  isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Meter Reading List</CardTitle>
          <CardDescription>View and manage all recorded meter readings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && displayedReadings.length === 0 ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading meter readings...
             </div>
          ) : (
            <MeterReadingsTable data={displayedReadings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
