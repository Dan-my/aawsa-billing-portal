
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { KnowledgeBaseArticle } from "./knowledge-base-types";

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }),
  category: z.string().optional(),
  keywords: z.string().optional().transform(val => val ? val.split(',').map(k => k.trim()).filter(Boolean) : []),
});

export type KnowledgeBaseFormValues = z.infer<typeof formSchema>;

interface KnowledgeBaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: KnowledgeBaseFormValues) => void;
  defaultValues?: KnowledgeBaseArticle | null;
}

export function KnowledgeBaseFormDialog({ open, onOpenChange, onSubmit, defaultValues }: KnowledgeBaseFormDialogProps) {
  const form = useForm<KnowledgeBaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      keywords: [],
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        title: defaultValues.title,
        content: defaultValues.content,
        category: defaultValues.category || "",
        keywords: defaultValues.keywords || [],
      });
    } else {
      form.reset({
        title: "",
        content: "",
        category: "",
        keywords: [],
      });
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (data: KnowledgeBaseFormValues) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Article" : "Add New Article"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the information for this article." : "Add a new article to the knowledge base for the chatbot."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., How to Reset Your Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide a detailed answer or explanation..." {...field} rows={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Billing, Account Management" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Keywords (Optional)</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="e.g., password, reset, login" 
                                {...field} 
                                // value is transformed to array, so we join it back for display
                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {defaultValues ? "Save Changes" : "Add Article"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
