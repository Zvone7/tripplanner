// types/segment.ts
export interface Option {
  id: number;
  name: string;
}

/**
 * This is the shape returned by your core Segment API (no connectedOptions).
 * Keep this minimal and shared everywhere.
 */
export interface SegmentApi {
  id: number;
  tripId: number;
  startDateTimeUtc: string;
  startDateTimeUtcOffset: number;
  endDateTimeUtc: string;
  endDateTimeUtcOffset: number;
  name: string;
  cost: number;
  segmentTypeId: number;
  comment: string;
}

export interface SegmentType {
  id: number
  shortName: string
  name: string
  description: string
  color: string
  iconSvg: string
}

export interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: SegmentSave, isUpdate: boolean, originalSegmentId?: number) => Promise<void>; // 👈 Promise
  segment?: Segment | null;
  tripId: number;
  segmentTypes: SegmentType[];
}

/** What your page actually renders (can include UI-only joins) */
export interface Segment extends SegmentApi {
  connectedOptions?: Option[]; // optional UI add-on
}

/** Payload used when creating/updating a segment */
export type SegmentSave = Omit<SegmentApi, "id">;
