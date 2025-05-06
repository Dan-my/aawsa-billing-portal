import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
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
            <Input id="app-name" defaultValue="AAWSA Billing Portal" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input id="currency" defaultValue="ETB" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="dark-mode" />
            <Label htmlFor="dark-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable Dark Mode by Default
            </Label>
          </div>
          <Button>
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
