
"use client";

import * as React from "react";
import type { ZodSchema, ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, FileWarning, CheckCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CsvUploadSectionProps<TFormValues> {
  entryType: "bulk" | "individual";
  schema: ZodSchema<TFormValues>;
  addRecordFunction: (data: TFormValues) => void;
  expectedHeaders: string[];
}

export function CsvUploadSection<TFormValues>({
  entryType,
  schema,
  addRecordFunction,
  expectedHeaders,
}: CsvUploadSectionProps<TFormValues>) {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingErrors, setProcessingErrors] = React.useState<string[]>([]);
  const [processingSuccessCount, setProcessingSuccessCount] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setProcessingErrors([]);
        setProcessingSuccessCount(0);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a valid .csv file.",
        });
        setFile(null);
         if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
        }
      }
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingErrors([]);
    setProcessingSuccessCount(0);
    let localSuccessCount = 0;
    const localErrors: string[] = [];

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        localErrors.push("File is empty or could not be read.");
        finalizeProcessing();
        return;
      }

      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ""); // Split and remove empty lines
      if (lines.length < 2) {
        localErrors.push("CSV file must contain a header row and at least one data row.");
        finalizeProcessing();
        return;
      }

      const headerLine = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, '')); // Trim and remove surrounding quotes
      
      // Validate headers
      if (headerLine.length !== expectedHeaders.length || !expectedHeaders.every((h, i) => h === headerLine[i])) {
         localErrors.push(`Invalid CSV headers. Expected: "${expectedHeaders.join(", ")}". Found: "${headerLine.join(", ")}". Please ensure column order and names match exactly.`);
         finalizeProcessing();
         return;
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, '')); // Trim and remove surrounding quotes
        if (values.length !== headerLine.length) {
          localErrors.push(`Row ${i + 1}: Incorrect number of columns. Expected ${headerLine.length}, found ${values.length}.`);
          continue;
        }

        const rowData: Record<string, any> = {};
        headerLine.forEach((header, index) => {
          rowData[header] = values[index];
        });
        
        try {
          const validatedData = schema.parse(rowData); // Zod handles coercion based on schema
          addRecordFunction(validatedData as TFormValues);
          localSuccessCount++;
        } catch (error) {
          if (error instanceof Error && (error as any).issues) { // ZodError
            const zodError = error as ZodError;
            const errorMessages = zodError.issues.map(issue => `Row ${i + 1} (${rowData.name || `Record ${i}`}), Column '${issue.path.join('.')}': ${issue.message}`).join("; ");
            localErrors.push(errorMessages);
          } else {
            localErrors.push(`Row ${i + 1}: Unknown error during validation. ${ (error as Error).message || error }`);
          }
        }
      }
      finalizeProcessing();
    };

    reader.onerror = () => {
        localErrors.push("Error reading the file.");
        finalizeProcessing();
    };
    
    reader.readAsText(file);

    function finalizeProcessing() {
        setProcessingSuccessCount(localSuccessCount);
        setProcessingErrors(localErrors);
        setIsProcessing(false);

        if (localSuccessCount > 0 && localErrors.length === 0) {
            toast({
                title: "CSV Processed Successfully",
                description: `${localSuccessCount} ${entryType} records added.`,
                className: "bg-green-100 dark:bg-green-900 border-green-500",
            });
        } else if (localSuccessCount > 0 && localErrors.length > 0) {
             toast({
                variant: "default",
                title: "CSV Partially Processed",
                description: `${localSuccessCount} records added. Some rows had errors. See details below.`,
                className: "bg-yellow-100 dark:bg-yellow-900 border-yellow-500",
            });
        } else if (localErrors.length > 0) {
            toast({
                variant: "destructive",
                title: "CSV Processing Failed",
                description: `No records were added. See error details below.`,
            });
        } else if (localSuccessCount === 0 && localErrors.length === 0) {
             toast({
                title: "CSV Processed",
                description: "No new records to add or file was empty after header.",
            });
        }

        // Reset file input after processing
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="flex-grow"
          disabled={isProcessing}
        />
        <Button
          onClick={handleProcessFile}
          disabled={!file || isProcessing}
          className="w-full sm:w-auto"
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          {isProcessing ? "Processing..." : `Upload ${entryType === "bulk" ? "Bulk Meters" : "Customers"}`}
        </Button>
      </div>
      
      {processingSuccessCount > 0 && (
        <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-300">Processing Complete</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Successfully processed {processingSuccessCount} {entryType} records.
          </AlertDescription>
        </Alert>
      )}

      {processingErrors.length > 0 && (
        <Alert variant="destructive">
          <FileWarning className="h-5 w-5" />
          <AlertTitle>Processing Errors Found</AlertTitle>
          <AlertDescription>
            The following errors occurred during CSV processing:
            <ScrollArea className="mt-2 h-[150px] w-full rounded-md border p-2 bg-background">
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {processingErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}
       {!file && processingSuccessCount === 0 && processingErrors.length === 0 && !isProcessing && (
        <Alert variant="default" className="border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-700 dark:text-blue-300">Ready to Upload</AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-400">
                Select a CSV file and click "Upload" to begin data entry.
            </AlertDescription>
        </Alert>
       )}
    </div>
  );
}
