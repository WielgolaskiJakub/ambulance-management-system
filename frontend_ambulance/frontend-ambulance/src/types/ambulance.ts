export type AmbulanceStatus = 
| "AVAILABLE"
| "IN_USE"
| "OUT_OF_SERVICE"

export type AmbulanceShortResponse = {
    id:number;
    registrationPlates: string;
    carBrand: string;
    model: string;
    mileage: number;
};

export type AmbulanceResponse = {
    id: number;
    carBrand: string;
    model: string;
    registrationPlates: string;
    mileage: number;
    summerFuelConsumptionNorm: number;
    winterFuelConsumptionNorm: number;
    tankCapacityLiters: number;
    estimatedFuelLiters: number | null;
    fuelEstimateUpdatedAt: string | null;
    status: AmbulanceStatus;
    active: boolean;
}