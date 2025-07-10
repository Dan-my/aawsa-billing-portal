

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LibraryBig, ListChecks, PlusCircle, RotateCcw, DollarSign, Percent } from "lucide-react";
import type { TariffTier, TariffInfo } from "@/lib/billing";
import { 
    getMeterRentPrices, DEFAULT_METER_RENT_PRICES, 
    METER_RENT_STORAGE_KEY
} from "@/lib/billing";
import { 
    getTariff, initializeTariffs, subscribeToTariffs, updateTariff, resetTariffsToDefault 
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


export default function TariffManagementPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [currentTariffType, setCurrentTariffType] = React.useState<'Domestic' | 'Non-domestic'>('Domestic');
  
  const [domesticTariffInfo, setDomesticTariffInfo] = React.useState<TariffInfo | undefined>(undefined);
  const [nonDomesticTariffInfo, setNonDomesticTariffInfo] = React.useState<TariffInfo | undefined>(undefined);
  const [isDataLoading, setIsDataLoading] = React.useState(true);

  const activeTariffInfo = currentTariffType === 'Domestic' ? domesticTariffInfo : nonDomesticTariffInfo;
  const activeTiers = getDisplayTiersFromData(activeTariffInfo);
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<DisplayTariffRate | null>(null);
  
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [rateToDelete, setRateToDelete] = React.useState<DisplayTariffRate | null>(null);

  const [meterRentPrices, setMeterRentPrices] = React.useState(() => getMeterRentPrices());
  const [isMeterRentDialogOpen, setIsMeterRentDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setIsDataLoading(true);
    initializeTariffs().then(() => {
      setDomesticTariffInfo(getTariff('Domestic'));
      setNonDomesticTariffInfo(getTariff('Non-domestic'));
      setIsDataLoading(false);
    });

    const unsubscribe = subscribeToTariffs((tariffs) => {
        setDomesticTariffInfo(tariffs.find(t => t.customer_type === 'Domestic'));
        setNonDomesticTariffInfo(tariffs.find(t => t.customer_type === 'Non-domestic'));
    });
    return () => unsubscribe();
  }, []);

  const handleTierUpdate = async (newTiers: TariffTier[]) => {
      if (!activeTariffInfo) return;

      const newTariffInfo: TariffInfo = {
          ...activeTariffInfo,
          tiers: newTiers,
      };

      const result = await updateTariff(activeTariffInfo.customer_type, newTariffInfo);
      if (result.success) {
          toast({ title: "Tariff Updated", description: `${currentTariffType} tariff has been successfully saved.` });
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
        .map(dt => ({ limit: dt.originalLimit, rate: dt.originalRate }))
        .sort((a,b) => a.limit - b.limit);
      
      handleTierUpdate(newRatesList);
      toast({ title: "Tariff Tier Deleted", description: `Tier "${rateToDelete.description}" has been removed from ${currentTariffType} tariffs.` });
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
  
  const handleSaveMeterRents = (newPrices: { [key: string]: number }) => {
    localStorage.setItem(METER_RENT_STORAGE_KEY, JSON.stringify(newPrices));
    setMeterRentPrices(newPrices);
    toast({ title: "Meter Rent Prices Updated", description: "The new prices will be used for all future calculations." });
    setIsMeterRentDialogOpen(false);
  };

  const handleResetToDefaults = async () => {
    await resetTariffsToDefault();
    localStorage.removeItem(METER_RENT_STORAGE_KEY);
    setMeterRentPrices(DEFAULT_METER_RENT_PRICES);

    toast({ title: "Settings Reset", description: `Tariff rates and meter rent prices have been reset to system defaults.` });
    setIsResetDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-3">
            <LibraryBig className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Tariff Management</h1>
        </div>
        {hasPermission('tariffs_update') && (
            <div className="flex gap-2 flex-wrap">
                <Button onClick={handleAddTier} className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Tier
                </Button>
                <Button onClick={() => setIsMeterRentDialogOpen(true)} variant="default">
                    <DollarSign className="mr-2 h-4 w-4" /> Manage Meter Rent
                </Button>
                <Button variant="destructive" onClick={() => setIsResetDialogOpen(true)}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Defaults
                </Button>
            </div>
        )}
      </div>

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
                    : "These rates are used for calculating non-domestic water bills. The single applicable rate is determined by the total consumption."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? <p>Loading tariffs...</p> : 
            <TariffRateTable 
              rates={activeTiers} 
              onEdit={handleEditTier} 
              onDelete={handleDeleteTier} 
              currency="ETB"
              canUpdate={hasPermission('tariffs_update')}
            />
            }
          </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-6 w-6 text-primary" />
            <CardTitle>Fees &amp; Charges ({currentTariffType})</CardTitle>
          </div>
          <CardDescription>
            Additional fees and taxes applied during bill calculation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm pt-4">
          {activeTariffInfo ? (
            <>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Maintenance Fee</span>
                <span className="font-semibold">{(activeTariffInfo.maintenance_percentage * 100).toFixed(0)}% of Base Water Charge</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Sanitation Fee</span>
                <span className="font-semibold">{(activeTariffInfo.sanitation_percentage * 100).toFixed(0)}% of Base Water Charge</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Sewerage Fee <span className="text-xs">(if applicable)</span></span>
                <span className="font-semibold">{activeTariffInfo.sewerage_rate_per_m3.toFixed(2)} ETB / m³</span>
              </div>
            </>
          ) : <p>Loading fee information...</p>}
           <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
            <span className="text-muted-foreground">Meter Rent Fee</span>
            <span className="font-semibold text-muted-foreground italic">Varies by meter size</span>
          </div>
           <div className="flex justify-between items-center p-2 rounded-md bg-muted/50 border border-primary/20">
            <div className="flex-1 pr-4">
                <span className="text-muted-foreground">VAT</span>
                {currentTariffType === 'Domestic' && (
                <p className="text-xs text-muted-foreground italic">For Domestic customers, VAT only applies if consumption is 16 m³ or more.</p>
                )}
            </div>
            <span className="font-semibold text-primary text-right">15% on (Base + Service Fees)</span>
          </div>
        </CardContent>
      </Card>
      
      {hasPermission('tariffs_update') && (
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
            defaultPrices={meterRentPrices}
            currency="ETB"
          />

          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to reset all tariffs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset both Domestic and Non-domestic tariffs AND all meter rent prices to the system defaults. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetToDefaults} className="bg-destructive hover:bg-destructive/90">Reset All Settings</AlertDialogAction>
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
        </>
      )}
    </div>
  );
}
