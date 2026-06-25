/**
 * Pure scheduling logic for resolving a staff member's working hours on a
 * given date. Kept free of any database access so it can be unit-tested
 * directly and reused on the server.
 */

export type WeeklyBlock = {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  locationId?: number | null;
};

export type ScheduleException = {
  date: string; // "YYYY-MM-DD"
  type: "time_off" | "custom_hours";
  startTime?: string | null;
  endTime?: string | null;
  locationId?: number | null;
};

export type AvailabilityBlock = {
  startTime: string;
  endTime: string;
  locationId: number | null;
};

/** Format a Date as a local "YYYY-MM-DD" string (no timezone conversion). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolve the working blocks for a staff member on `date`:
 *  - a full-day "time_off" exception clears the day entirely;
 *  - "custom_hours" exceptions replace the weekly template for that date;
 *  - otherwise the recurring weekly hours for that weekday apply.
 * Returned blocks are sorted by start time.
 */
export function getAvailabilityForDate(
  date: Date,
  weekly: WeeklyBlock[],
  exceptions: ScheduleException[]
): AvailabilityBlock[] {
  const isoDate = toIsoDate(date);
  const dayExceptions = exceptions.filter((e) => e.date === isoDate);

  if (dayExceptions.some((e) => e.type === "time_off")) {
    return [];
  }

  const customHours = dayExceptions.filter(
    (e) => e.type === "custom_hours" && e.startTime && e.endTime
  );

  const blocks: AvailabilityBlock[] =
    customHours.length > 0
      ? customHours.map((e) => ({
          startTime: e.startTime as string,
          endTime: e.endTime as string,
          locationId: e.locationId ?? null,
        }))
      : weekly
          .filter((b) => b.dayOfWeek === date.getDay())
          .map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            locationId: b.locationId ?? null,
          }));

  return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** True when the staff member has any working block on the given date. */
export function isAvailableOnDate(
  date: Date,
  weekly: WeeklyBlock[],
  exceptions: ScheduleException[]
): boolean {
  return getAvailabilityForDate(date, weekly, exceptions).length > 0;
}

/** A half-open time interval [start, end) expressed in epoch milliseconds. */
export type TimeInterval = { start: number; end: number };

/**
 * Returns the first interval in `others` that overlaps `target`, or null.
 * Intervals are half-open, so touching endpoints (one ends exactly when the
 * next begins) do NOT count as an overlap.
 */
export function findOverlap(target: TimeInterval, others: TimeInterval[]): TimeInterval | null {
  return others.find((o) => target.start < o.end && o.start < target.end) ?? null;
}

/** Convert "HH:MM" to minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes-since-midnight to "HH:MM". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type OpenSlot = { startTime: string; endTime: string; locationId: number | null };

/**
 * Enumerate bookable start times within the availability blocks, stepping by
 * `stepMinutes` (defaults to the appointment length) and dropping any candidate
 * that overlaps a busy range. `busyMinutes` ranges are expressed in
 * minutes-since-midnight for the same day as the blocks.
 *
 * When `locationId` is provided, only blocks at that location (or
 * location-agnostic blocks with a null location) are considered.
 */
export function generateOpenSlots(
  blocks: AvailabilityBlock[],
  busyMinutes: { start: number; end: number }[],
  durationMinutes: number,
  locationId?: number | null,
  stepMinutes: number = durationMinutes
): OpenSlot[] {
  if (durationMinutes <= 0 || stepMinutes <= 0) return [];
  const usableBlocks =
    locationId == null
      ? blocks
      : blocks.filter((b) => b.locationId == null || b.locationId === locationId);
  const slots: OpenSlot[] = [];
  for (const block of usableBlocks) {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);
    for (let s = blockStart; s + durationMinutes <= blockEnd; s += stepMinutes) {
      const e = s + durationMinutes;
      const overlaps = busyMinutes.some((b) => s < b.end && b.start < e);
      if (!overlaps) {
        slots.push({
          startTime: minutesToTime(s),
          endTime: minutesToTime(e),
          locationId: block.locationId,
        });
      }
    }
  }
  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Format the local time-of-day of a Date as "HH:MM". */
export function dateToTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * True when the interval [startTime, endTime) fits entirely inside one of the
 * availability blocks. When `locationId` is given, the block must either be
 * location-agnostic (null) or match that location.
 */
export function fitsInAvailability(
  blocks: AvailabilityBlock[],
  startTime: string,
  endTime: string,
  locationId?: number | null
): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (end <= start) return false;
  return blocks.some((b) => {
    const blockStart = timeToMinutes(b.startTime);
    const blockEnd = timeToMinutes(b.endTime);
    const locationOk = b.locationId == null || locationId == null || b.locationId === locationId;
    return locationOk && start >= blockStart && end <= blockEnd;
  });
}
