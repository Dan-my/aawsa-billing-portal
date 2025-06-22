
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LibraryBig, ListChecks, PlusCircle, RotateCcw } from "lucide-react";
import type { TariffTier } from "@/lib/billing";
import { DomesticTariffInfo, NonDomesticTariffInfo } from "@/lib/billing";
import { TariffRateTable, type DisplayTariffRate } from "./tariff-rate-table";
import { TariffFormDialog, type TariffFormValues } from "./tariff-form-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Helper to map TariffTier from billing logic to a display-friendly format
const mapTariffTierToDisplay = (tier: TariffTier, index: number, prevTier?: TariffTier): DisplayTariffRate => {
  let minConsumption: number;
  if (index === 0) {
    minConsumption = 1;
  } else if (prevTier) {
    minConsumption = prevTier.limit === Infinity ? Infinity : Math.floor(prevTier.limit) + 1;
  } else {
    minConsumption = 1; // Fallback for safety
  }

  const maxConsumptionDisplay = tier.limit === Infinity ? "Above" : String(Math.floor(tier.limit));
  const minConsumptionDisplay = minConsumption === Infinity ? "N/A" : String(minConsumption);

  const description = tier.limit === Infinity
    ? `Tier ${index + 1}: Above ${prevTier ? Math.floor(prevTier.limit) : 0} m³`
    : `Tier ${index + 1}: ${minConsumptionDisplay} - ${maxConsumptionDisplay} m³`;

  return {
    id: `tier-${index}-${tier.rate}-${tier.limit}`,
    description,
    minConsumption: minConsumptionDisplay,
    maxConsumption: maxConsumptionDisplay,
    rate: tier.rate,
    originalLimit: tier.limit,
    originalRate: tier.rate,
  };
};

// Gets the initial set of domestic tiers for display
const getDefaultDomesticDisplayTiers = (): DisplayTariffRate[] => {
  let previousTier: TariffTier | undefined;
  return DomesticTariffInfo.tiers.map((tier, index) => {
    const displayTier = mapTariffTierToDisplay(tier, index, previousTier);
    previousTier = tier;
    return displayTier;
  });
};

// Gets the initial set of non-domestic tiers for display
const getDefaultNonDomesticDisplayTiers = (): DisplayTariffRate[] => {
  let previousTier: TariffTier | undefined;
  return NonDomesticTariffInfo.tiers.map((tier, index) => {
    const displayTier = mapTariffTierToDisplay(tier, index, previousTier);
    previousTier = tier;
    return displayTier;
  });
};


export default function TariffManagementPage() {
  const { toast } = useToast();
  const [currentTariffType, setCurrentTariffType] = React.useState<'Domestic' | 'Non-domestic'>('Domestic');
  
  // Separate state for each tariff type
  const [domesticTiers, setDomesticTiers] = React.useState<DisplayTariffRate[]>(getDefaultDomesticDisplayTiers());
  const [nonDomesticTiers, setNonDomesticTiers] = React.useState<DisplayTariffRate[]>(getDefaultNonDomesticDisplayTiers());
  
  // These will now point to the correct state based on currentTariffType
  const activeTiers = currentTariffType === 'Domestic' ? domesticTiers : nonDomesticTiers;
  const setActiveTiers = currentTariffType === 'Domestic' ? setDomesticTiers : setNonDomesticTiers;
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<DisplayTariffRate | null>(null);
  
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [rateToDelete, setRateToDelete] = React.useState<DisplayTariffRate | null>(null);

  const reprocessTiersForDisplay = (tiers: DisplayTariffRate[]): DisplayTariffRate[] => {
      const sorted = [...tiers].sort((a, b) => a.originalLimit - b.originalLimit);
      
      return sorted.map((tier, index) => {
          const prevTier = index > 0 ? sorted[index - 1] : null;
          
          let minConsumption: number;
          if (index === 0) {
              minConsumption = 1; 
          } else if (prevTier) {
              minConsumption = prevTier.originalLimit === Infinity ? Infinity : Math.floor(prevTier.originalLimit) + 1;
          } else {
              minConsumption = 1;
          }
          
          const maxConsumptionDisplay = tier.originalLimit === Infinity ? "Above" : String(Math.floor(tier.originalLimit));
          const minConsumptionDisplay = minConsumption === Infinity ? "N/A" : String(minConsumption);

          // Only update calculated fields, preserve existing description
          return {
              ...tier,
              minConsumption: minConsumptionDisplay,
              maxConsumption: maxConsumptionDisplay,
          };
      });
  };


  const handleAddTier = () => {
    setEditingRate(null);
    setIsFormOpen(true);
  };

  const handleEditTier = (rate: DisplayTariffRate) => {
    setEditingRate(rate);
    setIsFormOpen(true);
  };

  const handleDeleteTier = (rate: DisplayTariffRate) => {
    setRateToDelete(rate);
  };

  const confirmDelete = () => {
    if (rateToDelete) {
      setActiveTiers(prev => {
        const newRatesList = prev.filter(r => r.id !== rateToDelete.id);
        return reprocessTiersForDisplay(newRatesList);
      });
      toast({ title: "Tariff Tier Deleted", description: `Tier "${rateToDelete.description}" has been removed from ${currentTariffType} tariffs.` });
      setRateToDelete(null);
    }
  };
  
  const handleSubmitTierForm = (data: TariffFormValues) => {
    const newRateValue = parseFloat(data.rate);
    const newMaxConsumptionValue = data.maxConsumption === "Infinity" ? Infinity : parseFloat(data.maxConsumption);

    if (editingRate) { // Editing existing tier
      setActiveTiers(prevRates => {
        const updatedRatesList = prevRates.map(r => 
          r.id === editingRate.id 
            ? { 
                ...r, 
                description: data.description,
                rate: newRateValue, 
                originalRate: newRateValue, 
                originalLimit: newMaxConsumptionValue,
              }
            : r
        );
        return reprocessTiersForDisplay(updatedRatesList);
      });
      toast({ title: "Tariff Tier Updated", description: `Tier "${data.description}" updated for ${currentTariffType} tariffs.` });

    } else { // Adding new tier
      setActiveTiers(prevRates => {
        const newTier: Omit<DisplayTariffRate, 'minConsumption' | 'maxConsumption'> = { 
            id: `new-tier-${Date.now()}`, 
            description: data.description,
            rate: newRateValue, 
            originalRate: newRateValue, 
            originalLimit: newMaxConsumptionValue,
        };
        // Add the new tier and then reprocess the whole list to calculate min/max correctly
        const newRatesList = [...prevRates, newTier as DisplayTariffRate];
        return reprocessTiersForDisplay(newRatesList);
      });
      toast({ title: "Tariff Tier Added", description: `New tier "${data.description}" added to ${currentTariffType} tariffs.` });
    }
    setIsFormOpen(false);
    setEditingRate(null);
  };

  const handleResetToDefaults = () => {
    if (currentTariffType === 'Domestic') {
        setDomesticTiers(getDefaultDomesticDisplayTiers());
    } else {
        setNonDomesticTiers(getDefaultNonDomesticDisplayTiers());
    }
    toast({ title: "Tariffs Reset", description: `${currentTariffType} tariff rates have been reset to system defaults.` });
    setIsResetDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/20 shadow-none border-none">
        <CardHeader className="px-0 md:px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
                <LibraryBig className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl">Tariff Knowledge Base</CardTitle>
                    <CardDescription className="text-sm">Manage water tariff rates used for bill calculations.</CardDescription>
                </div>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
                <Button onClick={handleAddTier}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Tariff Tier
                </Button>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsResetDialogOpen(true)}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset to Defaults
                </Button>
            </div>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="customer-category">Select Customer Category</Label>
        <Select 
            value={currentTariffType} 
            onValueChange={(value) => setCurrentTariffType(value as 'Domestic' | 'Non-domestic')}
        >
          <SelectTrigger id="customer-category" className="w-full md:w-[300px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Domestic">Domestic</SelectItem>
            <SelectItem value="Non-domestic">Non-domestic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-lg mt-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              <CardTitle>Current Tariff Rates ({currentTariffType})</CardTitle>
            </div>
            <CardDescription>
                {currentTariffType === 'Domestic' 
                    ? "These rates are used for calculating domestic water bills. Rates are applied progressively."
                    : "These rates are used for calculating non-domestic water bills. Rates are applied progressively."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TariffRateTable 
              rates={activeTiers} 
              onEdit={handleEditTier} 
              onDelete={handleDeleteTier} 
              currency="ETB"
            />
          </CardContent>
      </Card>

      <TariffFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitTierForm}
        defaultValues={editingRate ? { 
            description: editingRate.description,
            maxConsumption: editingRate.originalLimit === Infinity ? "Infinity" : String(editingRate.originalLimit),
            rate: String(editingRate.originalRate)
        } : null}
        currency="ETB"
      />

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reset tariffs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the current tariff configuration for <span className="font-semibold">{currentTariffType}</span> to the system default. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetToDefaults} className="bg-destructive hover:bg-destructive/90">Reset Tariffs</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rateToDelete} onOpenChange={(open) => !open && setRateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tier?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Tier: "{rateToDelete?.description}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Tier</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
