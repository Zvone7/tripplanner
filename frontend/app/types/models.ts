// types/models.ts

/* -----------------------------------------------------------------------------
 * Location
 * ---------------------------------------------------------------------------*/
export interface LocationOption {
  id?: number;

  provider: string;        // e.g. "locationiq"
  providerPlaceId: string; // e.g. "156188258"

  name: string;            // e.g. "Oslo"
  country?: string;        // e.g. "Norway"
  countryCode?: string;    // e.g. "no"
  formatted?: string;      // e.g. "Oslo, Norway"

  lat: number;
  lng: number;
}

export interface LocationDto {
  id: number;                 // use 0 for “new” if no DB id
  providerPlaceId: string;
  provider: string;
  name: string;
  countryCode?: string;
  country: string;
  latitude: number;
  longitude: number;
}

/* -----------------------------------------------------------------------------
 * Segment types
 * ---------------------------------------------------------------------------*/
export interface SegmentType {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  iconSvg?: string;
  color?: string;
}

export interface OptionRef {
  id: number;
  name: string;
}

export interface SegmentApi {
  id: number;
  tripId?: number; // optional if not always returned
  name: string;

  // Timing
  startDateTimeUtc: string;
  startDateTimeUtcOffset: number;
  endDateTimeUtc: string;
  endDateTimeUtcOffset: number;

  segmentTypeId: number;
  cost: number;

  comment?: string;
  color?: string;
  isUiVisible: boolean;

  StartLocation?: LocationOption | LocationDto | null;
  EndLocation?: LocationOption | LocationDto | null;
}

export interface Segment extends SegmentApi {
  connectedOptions?: OptionRef[]; // optional UI add-on
}

export type SegmentSave = Omit<SegmentApi, "id">;

export interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: SegmentSave, isUpdate: boolean, originalSegmentId?: number) => Promise<void>;
  segment?: Segment | null;
  tripId: number;
  segmentTypes: SegmentType[];
}


/* -----------------------------------------------------------------------------
 * Option types
 * ---------------------------------------------------------------------------*/
export interface OptionApi {
  id: number;
  name: string;
  startDateTimeUtc: string | null;
  endDateTimeUtc: string | null;
  tripId: number;
  isUiVisible: boolean;

  totalCost: number;
  totalDays: number;
  costPerDay: number;
  costPerType: Record<string | number, number>;
}

export type OptionSave = Omit<OptionApi, "id" | "totalCost" | "totalDays">;

/* -----------------------------------------------------------------------------
 * User
 * ---------------------------------------------------------------------------*/
export interface UserPreference {
  preferredUtcOffset: number;
}

export interface User {
  userPreference: UserPreference;
}
