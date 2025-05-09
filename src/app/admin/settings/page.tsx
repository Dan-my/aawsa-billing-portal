
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertTriangle, Info, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TARIFF_RATES_BY_TYPE } from "@/app/admin/individual-customers/individual-customer-types";

const APP_NAME_KEY = "aawsa-app-name";
const CURRENCY_KEY = "aawsa-default-currency";
const DARK_MODE_KEY = "aawsa-dark-mode-default";
const BILLING_CYCLE_DAY_KEY = "aawsa-billing-cycle-day";
const ENABLE_OVERDUE_REMINDERS_KEY = "aawsa-enable-overdue-reminders";

const billingCycleDays = Array.from({ length: 28 }, (_, i) => (i + 1).toString());

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [appName, setAppName] = React.useState("AAWSA Billing Portal");
  const [defaultCurrency, setDefaultCurrency] = React.useState("ETB");
  const [enableDarkMode, setEnableDarkMode] = React.useState(false);
  const [billingCycleDay, setBillingCycleDay] = React.useState("1");
  const [enableOverdueReminders, setEnableOverdueReminders] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const storedAppName = localStorage.getItem(APP_NAME_KEY);
    const storedCurrency = localStorage.getItem(CURRENCY_KEY);
    const storedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    const storedBillingCycleDay = localStorage.getItem(BILLING_CYCLE_DAY_KEY);
    const storedEnableOverdueReminders = localStorage.getItem(ENABLE_OVERDUE_REMINDERS_KEY);

    if (storedAppName) setAppName(storedAppName);
    if (storedCurrency) setDefaultCurrency(storedCurrency);
    if (storedDarkMode) setEnableDarkMode(storedDarkMode === "true");
    if (storedBillingCycleDay) setBillingCycleDay(storedBillingCycleDay);
    if (storedEnableOverdueReminders) setEnableOverdueReminders(storedEnableOverdueReminders === "true");
    
    // Apply dark mode on initial load if enabled
    if (storedDarkMode === "true") {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem(APP_NAME_KEY, appName);
    localStorage.setItem(CURRENCY_KEY, defaultCurrency);
    localStorage.setItem(DARK_MODE_KEY, String(enableDarkMode));
    localStorage.setItem(BILLING_CYCLE_DAY_KEY, billingCycleDay);
    localStorage.setItem(ENABLE_OVERDUE_REMINDERS_KEY, String(enableOverdueReminders));

    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated.",
    });

    document.title = appName;
    if (enableDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  if (!isMounted) {
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
            <Label htmlFor="dark-mode" className="font-medium">
              Enable Dark Mode by Default
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
          <CardDescription>Manage billing cycle, tariff rates, and reminder configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="billing-cycle-day">Billing Cycle Day</Label>
            <Select value={billingCycleDay} onValueChange={setBillingCycleDay}>
              <SelectTrigger id="billing-cycle-day" className="w-full md:w-[200px]">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {billingCycleDays.map(day => (
                  <SelectItem key={day} value={day}>Day {day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The day of the month when new bills are generated.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="overdue-reminders" 
              checked={enableOverdueReminders}
              onCheckedChange={(checked) => setEnableOverdueReminders(checked as boolean)}
            />
            <Label htmlFor="overdue-reminders" className="font-medium">
              Enable Automatic Overdue Reminders
            </Label>
          </div>
          
          <div className="p-4 border rounded-md bg-muted/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Current Tariff Rates</h3>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="font-medium">Domestic:</span>
                <span className="ml-2 font-mono text-accent">{defaultCurrency} {TARIFF_RATES_BY_TYPE.Domestic.toFixed(2)} / m³</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Non-domestic:</span>
                <span className="ml-2 font-mono text-accent">{defaultCurrency} {TARIFF_RATES_BY_TYPE["Non-domestic"].toFixed(2)} / m³</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              These rates are currently managed centrally. Contact system administrators for changes.
            </p>
          </div>

          <div className="mt-4 p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/30 rounded-md">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">Advanced Settings (Coming Soon)</h3>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Late fee policies, detailed notification preferences, and data export configurations will be available here in future updates.
            </p>
          </div>

        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}
