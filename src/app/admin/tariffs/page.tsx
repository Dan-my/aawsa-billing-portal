

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LibraryBig, ListChecks, PlusCircle, RotateCcw, DollarSign, Percent, Copy } from "lucide-react";
import type { TariffTier, TariffInfo } from "@/lib/billing";
import { 
    getTariff, initializeTariffs, subscribeToTariffs, updateTariff, addTariff 
} from "@/lib/data-store";
import { TariffRateTable, type DisplayTariffRate } from "./tariff-rate-table";
import { TariffFormDialog, type TariffFormValues } from "./tariff-form-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MeterRentDialog } from "./meter-rent-dialog";
import { usePermissions } from "@/hooks/use-permissions";

const mapTariffTierToDisplay = (tier: TariffTier, index: number, prevTier?: TariffTier): DisplayTariffRate => {
  let minConsumption: number;
  if (index === 0) {
    minConsumption = 1;
  } else if (prevTier) {
    minConsumption = prevTier.limit === Infinity ? Infinity : Math.floor(prevTier.limit) + 1;
  } else {
    minConsumption = 1;
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

const getDisplayTiersFromData = (tariffInfo?: TariffInfo): DisplayTariffRate[] => {
    if (!tariffInfo || !tariffInfo.tiers) return [];
    let previousTier: TariffTier | undefined;
    return tariffInfo.tiers.map((tier, index) => {
        const displayTier = mapTariffTierToDisplay(tier, index, previousTier);
        previousTier = tier;
        return displayTier;
    });
};

const generateYearOptions = () => {
    const years = [];
    for (let i = 2021; i <= 2050; i++) {
        years.push(i);
    }
    return years;
};


export default function TariffManagementPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  const [currentYear, setCurrentYear] = React.useState<number>(new Date().getFullYear());
  const [currentTariffType, setCurrentTariffType] = React.useState<'Domestic' | 'Non-domestic'>('Domestic');
  const [allTariffs, setAllTariffs] = React.useState<TariffInfo[]>([]);
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<DisplayTariffRate | null>(null);
  
  const [rateToDelete, setRateToDelete] = React.useState<DisplayTariffRate | null>(null);

  const [isMeterRentDialogOpen, setIsMeterRentDialogOpen] = React.useState(false);

  const activeTariffInfo = React.useMemo(() => {
    return allTariffs.find(t => t.customer_type === currentTariffType && t.year === currentYear);
  }, [allTariffs, currentTariffType, currentYear]);

  const activeTiers = getDisplayTiersFromData(activeTariffInfo);
  const yearOptions = React.useMemo(() => generateYearOptions(), []);

  React.useEffect(() => {
    setIsDataLoading(true);
    initializeTariffs().then((tariffs) => {
      setAllTariffs(tariffs as any); // Type assertion needed for now
      setIsDataLoading(false);
    });

    const unsubscribe = subscribeToTariffs(setAllTariffs as any);
    return () => unsubscribe();
  }, []);

  const handleTierUpdate = async (newTiers: TariffTier[]) => {
      if (!activeTariffInfo) return;

      const newTariffInfo: Partial<TariffInfo> = {
          tiers: newTiers,
      };

      const result = await updateTariff(activeTariffInfo.customer_type, activeTariffInfo.year, newTariffInfo);
      if (result.success) {
          toast({ title: "Tariff Updated", description: `${currentTariffType} tariff rates for ${currentYear} have been saved.` });
      } else {
          toast({ variant: "destructive", title: "Update Failed", description: result.message });
      }
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
    if (rateToDelete && activeTiers) {
      const newRatesList = activeTiers
        .filter(r => r.id !== rateToDelete.id)
        .map(dt => ({ rate: dt.originalRate, limit: dt.originalLimit }))
        .sort((a,b) => a.limit - b.limit);
      
      handleTierUpdate(newRatesList);
      toast({ title: "Tariff Tier Deleted", description: `Tier "${rateToDelete.description}" has been removed from ${currentTariffType} tariffs for ${currentYear}.` });
      setRateToDelete(null);
    }
  };
  
  const handleSubmitTierForm = (data: TariffFormValues) => {
    const newRateValue = parseFloat(data.rate);
    const newMaxConsumptionValue = data.maxConsumption === "Infinity" ? Infinity : parseFloat(data.maxConsumption);

    let updatedTiers: TariffTier[];

    if (editingRate) {
      updatedTiers = activeTiers.map(r => 
        r.id === editingRate.id 
          ? { rate: newRateValue, limit: newMaxConsumptionValue }
          : { rate: r.originalRate, limit: r.originalLimit }
      );
    } else {
      updatedTiers = [
        ...activeTiers.map(r => ({ rate: r.originalRate, limit: r.originalLimit })),
        { rate: newRateValue, limit: newMaxConsumptionValue }
      ];
    }
    
    updatedTiers.sort((a,b) => a.limit - b.limit);
    handleTierUpdate(updatedTiers);
    
    setIsFormOpen(false);
    setEditingRate(null);
  };
  
  const handleSaveMeterRents = async (newPrices: { [key: string]: number }) => {
    if (!activeTariffInfo) {
      toast({ variant: "destructive", title: "Error", description: "No active tariff selected to save meter rents." });
      return;
    }
    
    const updatePayload: Partial<TariffInfo> = {
        meter_rent_prices: newPrices,
    };
    
    const result = await updateTariff(activeTariffInfo.customer_type, activeTariffInfo.year, updatePayload);
    
    if (result.success) {
      toast({ title: "Meter Rent Prices Updated", description: `New prices for ${currentYear} have been saved.` });
      setIsMeterRentDialogOpen(false);
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.message });
    }
  };

  const handleCreateNewYearTariff = async () => {
    if (!activeTariffInfo) {
      toast({ variant: "destructive", title: "Cannot Create Tariff", description: `No base tariff found for ${currentTariffType} in ${currentYear} to copy from.` });
      return;
    }
    
    const newYear = currentYear + 1;
    const existingTariffForNewYear = allTariffs.find(t => t.customer_type === currentTariffType && t.year === newYear);

    if (existingTariffForNewYear) {
      toast({ variant: "destructive", title: "Tariff Already Exists", description: `A tariff for ${currentTariffType} in ${newYear} already exists. Please select it from the dropdown to edit.` });
      return;
    }
    
    const newTariffData: Omit<TariffInfo, 'id'> = {
      ...activeTariffInfo,
      year: newYear,
    };
    
    const result = await addTariff(newTariffData);

    if (result.success) {
      toast({ title: "New Tariff Created", description: `Successfully created tariff for ${currentTariffType} for the year ${newYear}, copied from ${currentYear}.` });
      setCurrentYear(newYear); // Switch to the new year
    } else {
      toast({ variant: "destructive", title: "Creation Failed", description: result.message });
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <LibraryBig className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Tariff Management</h1>
        </div>
        {hasPermission('tariffs_update') && (
            <div className="flex gap-2 flex-wrap">
                 <Button onClick={handleCreateNewYearTariff} variant="outline" disabled={!activeTariffInfo}>
                    <Copy className="mr-2 h-4 w-4" /> Copy to {currentYear + 1}
                </Button>
                <Button onClick={handleAddTier} className="bg-primary hover:bg-primary/90" disabled={!activeTariffInfo}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Tier
                </Button>
                <Button onClick={() => setIsMeterRentDialogOpen(true)} variant="default" disabled={!activeTariffInfo}>
                    <DollarSign className="mr-2 h-4 w-4" /> Manage Meter Rent
                </Button>
            </div>
        )}
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tariff-year">Select Year</Label>
             <Select 
                value={String(currentYear)} 
                onValueChange={(value) => setCurrentYear(Number(value))}
            >
              <SelectTrigger id="tariff-year" className="w-full md:w-[200px]">
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-category">Select Customer Category</Label>
            <Select 
                value={currentTariffType} 
                onValueChange={(value) => setCurrentTariffType(value as 'Domestic' | 'Non-domestic')}
            >
              <SelectTrigger id="customer-category" className="w-full md:w-[200px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Domestic">Domestic</SelectItem>
                <SelectItem value="Non-domestic">Non-domestic</SelectItem>
              </SelectContent>
            </Select>
          </div>
       </div>

       {isDataLoading ? <p>Loading tariffs...</p> : !activeTariffInfo ?
         (<Card className="shadow-lg mt-4 border-dashed border-amber-500"><CardHeader><CardTitle className="text-amber-600">No Tariff Found</CardTitle><CardDescription>There is no tariff data for {currentTariffType} for the year {currentYear}. You can create one by copying settings from another year.</CardDescription></CardHeader></Card>) : (
         <>
          <Card className="shadow-lg mt-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListChecks className="h-6 w-6 text-primary" />
                  <CardTitle>Current Tariff Rates ({currentTariffType} - {currentYear})</CardTitle>
                </div>
                <CardDescription>
                    {currentTariffType === 'Domestic' 
                        ? "These rates are used for calculating domestic water bills. Rates are applied progressively."
                        : "These rates are used for calculating non-domestic water bills. The single applicable rate is determined by the total consumption."
                    }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TariffRateTable 
                  rates={activeTiers} 
                  onEdit={handleEditTier} 
                  onDelete={handleDeleteTier} 
                  currency="ETB"
                  canUpdate={hasPermission('tariffs_update')}
                />
              </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-6 w-6 text-primary" />
                <CardTitle>Fees &amp; Charges ({currentTariffType} - {currentYear})</CardTitle>
              </div>
              <CardDescription>
                Additional fees and taxes applied during bill calculation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pt-4">
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Maintenance Fee</span>
                <span className="font-semibold">{(activeTariffInfo.maintenance_percentage * 100).toFixed(0)}% of Base Water Charge</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Sanitation Fee</span>
                <span className="font-semibold">{(activeTariffInfo.sanitation_percentage * 100).toFixed(0)}% of Base Water Charge</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                 <span className="text-muted-foreground">Sewerage Fee (if applicable)</span>
                 <span className="font-semibold">{activeTariffInfo.sewerage_rate_per_m3} ETB / m³</span>
              </div>
               <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Meter Rent Fee</span>
                <span className="font-semibold text-muted-foreground italic">Varies by meter size. Managed via "Manage Meter Rent" button.</span>
              </div>
               <div className="flex justify-between items-center p-2 rounded-md bg-muted/50 border border-primary/20">
                <div className="flex-1 pr-4">
                    <span className="text-muted-foreground">VAT</span>
                    {currentTariffType === 'Domestic' && (
                    <p className="text-xs text-muted-foreground italic">For Domestic customers, VAT only applies if consumption is 16 m³ or more.</p>
                    )}
                </div>
                <span className="font-semibold text-primary text-right">15%</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {hasPermission('tariffs_update') && activeTariffInfo && (
        <>
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

          <MeterRentDialog
            open={isMeterRentDialogOpen}
            onOpenChange={setIsMeterRentDialogOpen}
            onSubmit={handleSaveMeterRents}
            defaultPrices={activeTariffInfo.meter_rent_prices as { [key: string]: number }}
            currency="ETB"
            year={currentYear}
          />
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
        </>
      )}
    </div>
  );
}
