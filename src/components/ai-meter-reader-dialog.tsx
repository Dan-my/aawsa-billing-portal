
"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, AlertCircle } from "lucide-react";
import { readMeterFromImage } from "@/ai/flows/read-meter-flow";

interface AiMeterReaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReadingSuccess: (reading: number) => void;
}

export function AiMeterReaderDialog({ open, onOpenChange, onReadingSuccess }: AiMeterReaderDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Invalid file type. Please upload an image (JPEG, PNG, etc.).");
        setFile(null);
      }
    }
  };

  const handleProcessImage = async () => {
    if (!file) {
      setError("Please select an image file to upload.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 1: Upload the image to our custom API endpoint
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorResult = await uploadResponse.json();
        throw new Error(errorResult.error || 'File upload failed.');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.url;

      // In a real app, you would now save `imageUrl` to your database.
      // For this example, we proceed directly to AI processing.

      // Step 2: Send the public URL to the AI for processing
      const result = await readMeterFromImage({ photoUrl: imageUrl });
      
      if (result && typeof result.reading === 'number') {
          onReadingSuccess(result.reading);
          toast({ title: "Success", description: `AI read the value: ${result.reading}` });
          onOpenChange(false); // Close dialog on success
      } else {
          throw new Error("The AI model returned an invalid result.");
      }
    } catch (err: any) {
      console.error("AI Meter Reading Error:", err);
      const errorMessage = err.message || "An unexpected error occurred while processing the image.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "AI Reading Failed",
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset state when dialog is closed
  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setError(null);
      setIsProcessing(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Meter Reader</DialogTitle>
          <DialogDescription>
            Upload a clear photo of the water meter display. The AI will attempt to read the numbers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="meter-photo">Meter Photo</Label>
                <Input id="meter-photo" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing}/>
            </div>
            
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {file && (
                <div className="text-sm text-muted-foreground">
                    Selected file: <strong>{file.name}</strong>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="button" onClick={handleProcessImage} disabled={!file || isProcessing}>
            {isProcessing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Read Image
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
