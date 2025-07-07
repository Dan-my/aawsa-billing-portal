
"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readMeterFromImage } from "@/ai/flows/read-meter-flow";


// A generic meter type that covers both Individual and Bulk meters for props
interface GenericMeter {
  customerKeyNumber: string;
  name: string;
  currentReading: number;
}

interface AddReadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (readingValue: number) => Promise<void>; // Make it async
  meter: GenericMeter;
}

export function AddReadingDialog({ open, onOpenChange, onSubmit, meter }: AddReadingDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAiReading, setIsAiReading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formSchema = React.useMemo(() => z.object({
    reading: z.coerce.number().min(meter.currentReading, {
      message: `Reading must be >= current reading of ${meter.currentReading.toFixed(2)}.`,
    }),
  }), [meter.currentReading]);

  const form = useForm<{ reading: number }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reading: meter.currentReading,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ reading: meter.currentReading });
    }
  }, [open, meter.currentReading, form]);

  const handleSubmit = async (data: { reading: number }) => {
    setIsSubmitting(true);
    await onSubmit(data.reading);
    setIsSubmitting(false);
    onOpenChange(false);
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAiReading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const photoDataUri = reader.result as string;
        const result = await readMeterFromImage({ photoDataUri });
        if (result.reading) {
          form.setValue("reading", result.reading, { shouldValidate: true });
          toast({
            title: "AI Reading Successful",
            description: `The AI read a value of ${result.reading}. Please confirm and save.`,
          });
        } else {
          throw new Error("The AI returned an empty reading.");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "AI Reading Failed",
          description: error instanceof Error ? error.message : "Could not read the meter from the image.",
        });
      } finally {
        setIsAiReading(false);
        // Reset file input to allow uploading the same file again
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
        setIsAiReading(false);
        toast({ variant: "destructive", title: "File Error", description: "Could not read the selected image file."});
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Reading for {meter.name}</DialogTitle>
          <DialogDescription>
            Enter the new reading from the meter, or use the camera icon to read it automatically from an image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="reading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Reading Value</FormLabel>
                   <div className="relative">
                      <FormControl>
                          <Input type="number" step="0.01" {...field} disabled={isSubmitting || isAiReading} className="pr-10"/>
                      </FormControl>
                      <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                          accept="image/*"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAiReading || isSubmitting}
                        aria-label="Read from image"
                      >
                        {isAiReading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isAiReading}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isAiReading}>
                {isSubmitting ? "Saving..." : "Save Reading"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
