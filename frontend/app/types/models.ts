// types/models.ts

export interface SegmentType {
  id: number;
  name: string;
  iconSvg: string;
  color: string;
}
/**
 * Minimal Segment shape you get from your Segment APIs.
 * Keep this free of UI-only fields.
 */
export interface SegmentApi {
  id: number;
  name: string;
  segmentTypeId: number;
  color: string;
  startDateTimeUtc: string;
  startDateTimeUtcOffset: number;
  endDateTimeUtc: string;
  endDateTimeUtcOffset: number;
  cost: number;
}


/**
 * Minimal Option shape as returned by your Option APIs.
 */
export interface OptionApi {
  id: number;
  name: string;
  startDateTimeUtc: string | null;
  endDateTimeUtc: string | null;
  tripId: number;
  totalCost: number;
  totalDays: number;
  costPerDay: number;
  costPerType: Record<string | number, number>;
}


/**
 * Payload used when creating/updating an option from the modal.
 */
export type OptionSave = Omit<OptionApi, "id" | "totalCost" | "totalDays">;
