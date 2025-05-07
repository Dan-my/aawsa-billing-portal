"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const APP_NAME_KEY = "aawsa-app-name";
const CURRENCY_KEY = "aawsa-default-currency";
const DARK_MODE_KEY = "aawsa-dark-mode-default";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [appName, setAppName] = React.useState("AAWSA Billing Portal");
  const [defaultCurrency, setDefaultCurrency] = React.useState("ETB");
  const [enableDarkMode, setEnableDarkMode] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const storedAppName = localStorage.getItem(APP_NAME_KEY);
    const storedCurrency = localStorage.getItem(CURRENCY_KEY);
    const storedDarkMode = localStorage.getItem(DARK_MODE_KEY);

    if (storedAppName) {
      setAppName(storedAppName);
    }
    if (storedCurrency) {
      setDefaultCurrency(storedCurrency);
    }
    if (storedDarkMode) {
      setEnableDarkMode(storedDarkMode === "true");
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem(APP_NAME_KEY, appName);
    localStorage.setItem(CURRENCY_KEY, defaultCurrency);
    localStorage.setItem(DARK_MODE_KEY, String(enableDarkMode));
    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated.",
    });

    // Potentially update document title if appName changes
    document.title = appName;
    // Potentially apply dark mode if it's enabled (this might need more complex theme switching logic)
    if (enableDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  if (!isMounted) {
    // To prevent hydration mismatch, render nothing or a loader until client-side effects run
    return null; 
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Application Settings</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure application-wide settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input 
              id="app-name" 
              value={appName}
              onChange={(e) => setAppName(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input 
              id="currency" 
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)} 
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dark-mode" 
              checked={enableDarkMode}
              onCheckedChange={(checked) => setEnableDarkMode(checked as boolean)}
            />
            <Label htmlFor="dark-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable Dark Mode by Default
            </Label>
          </div>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
           <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            More settings options coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
