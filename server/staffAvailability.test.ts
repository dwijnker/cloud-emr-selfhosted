import { describe, it, expect } from "vitest";
import {
  getAvailabilityForDate,
  isAvailableOnDate,
  toIsoDate,
  fitsInAvailability,
  timeToMinutes,
  dateToTime,
  findOverlap,
  generateOpenSlots,
  type WeeklyBlock,
  type ScheduleException,
  type AvailabilityBlock,
} from "./staffAvailability";

// 2026-06-24 is a Wednesday (getDay() === 3).
const WEDNESDAY = new Date(2026, 5, 24, 12, 0, 0);
const THURSDAY = new Date(2026, 5, 25, 12, 0, 0);

const weekly: WeeklyBlock[] = [
  { dayOfWeek: 3, startTime: "09:00", endTime: "12:00", locationId: 1 },
  { dayOfWeek: 3, startTime: "13:00", endTime: "17:00", locationId: 2 },
  { dayOfWeek: 4, startTime: "08:00", endTime: "16:00", locationId: 1 },
];

describe("toIsoDate", () => {
  it("formats a local date as YYYY-MM-DD without timezone drift", () => {
    expect(toIsoDate(WEDNESDAY)).toBe("2026-06-24");
  });
});

describe("getAvailabilityForDate", () => {
  it("returns the weekly blocks for the matching weekday, sorted by start", () => {
    const blocks = getAvailabilityForDate(WEDNESDAY, weekly, []);
    expect(blocks).toEqual([
      { startTime: "09:00", endTime: "12:00", locationId: 1 },
      { startTime: "13:00", endTime: "17:00", locationId: 2 },
    ]);
  });

  it("returns nothing for a weekday with no weekly blocks", () => {
    const saturday = new Date(2026, 5, 27, 12, 0, 0);
    expect(getAvailabilityForDate(saturday, weekly, [])).toEqual([]);
  });

  it("clears the day when a time_off exception applies", () => {
    const exceptions: ScheduleException[] = [{ date: "2026-06-24", type: "time_off" }];
    expect(getAvailabilityForDate(WEDNESDAY, weekly, exceptions)).toEqual([]);
  });

  it("replaces the weekly template with custom_hours on that date", () => {
    const exceptions: ScheduleException[] = [
      { date: "2026-06-24", type: "custom_hours", startTime: "10:00", endTime: "14:00", locationId: 2 },
    ];
    expect(getAvailabilityForDate(WEDNESDAY, weekly, exceptions)).toEqual([
      { startTime: "10:00", endTime: "14:00", locationId: 2 },
    ]);
  });

  it("only applies an exception to its own date", () => {
    const exceptions: ScheduleException[] = [{ date: "2026-06-24", type: "time_off" }];
    // Thursday is unaffected by Wednesday's time off.
    expect(getAvailabilityForDate(THURSDAY, weekly, exceptions)).toEqual([
      { startTime: "08:00", endTime: "16:00", locationId: 1 },
    ]);
  });

  it("ignores custom_hours exceptions missing a start or end time", () => {
    const exceptions: ScheduleException[] = [
      { date: "2026-06-24", type: "custom_hours", startTime: "10:00" },
    ];
    // Falls back to the weekly template since the custom block is incomplete.
    expect(getAvailabilityForDate(WEDNESDAY, weekly, exceptions)).toEqual([
      { startTime: "09:00", endTime: "12:00", locationId: 1 },
      { startTime: "13:00", endTime: "17:00", locationId: 2 },
    ]);
  });
});

describe("isAvailableOnDate", () => {
  it("is true when blocks exist and false otherwise", () => {
    expect(isAvailableOnDate(WEDNESDAY, weekly, [])).toBe(true);
    expect(isAvailableOnDate(WEDNESDAY, weekly, [{ date: "2026-06-24", type: "time_off" }])).toBe(false);
  });
});

describe("timeToMinutes / dateToTime", () => {
  it("converts HH:MM to minutes", () => {
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("13:30")).toBe(810);
  });

  it("formats a Date's local time as HH:MM", () => {
    expect(dateToTime(new Date(2026, 5, 24, 9, 5))).toBe("09:05");
    expect(dateToTime(new Date(2026, 5, 24, 14, 0))).toBe("14:00");
  });
});

describe("fitsInAvailability", () => {
  const blocks: AvailabilityBlock[] = [
    { startTime: "09:00", endTime: "12:00", locationId: 1 },
    { startTime: "13:00", endTime: "17:00", locationId: 2 },
  ];

  it("accepts an interval fully inside a block", () => {
    expect(fitsInAvailability(blocks, "09:30", "10:00")).toBe(true);
    expect(fitsInAvailability(blocks, "13:00", "17:00")).toBe(true);
  });

  it("rejects an interval that spills past a block's end", () => {
    expect(fitsInAvailability(blocks, "11:30", "12:30")).toBe(false);
  });

  it("rejects an interval that falls in a gap between blocks", () => {
    expect(fitsInAvailability(blocks, "12:15", "12:45")).toBe(false);
  });

  it("rejects a zero or negative length interval", () => {
    expect(fitsInAvailability(blocks, "10:00", "10:00")).toBe(false);
  });

  it("enforces a matching location when one is requested", () => {
    expect(fitsInAvailability(blocks, "13:30", "14:00", 2)).toBe(true);
    expect(fitsInAvailability(blocks, "13:30", "14:00", 1)).toBe(false);
  });

  it("treats location-agnostic blocks as matching any location", () => {
    const anyLocation: AvailabilityBlock[] = [{ startTime: "09:00", endTime: "17:00", locationId: null }];
    expect(fitsInAvailability(anyLocation, "10:00", "11:00", 5)).toBe(true);
  });
});

describe("findOverlap", () => {
  // 10:00–10:30 target window.
  const target = { start: Date.UTC(2026, 5, 24, 10, 0), end: Date.UTC(2026, 5, 24, 10, 30) };

  it("returns null when no other interval overlaps", () => {
    const others = [
      { start: Date.UTC(2026, 5, 24, 9, 0), end: Date.UTC(2026, 5, 24, 9, 30) },
      { start: Date.UTC(2026, 5, 24, 11, 0), end: Date.UTC(2026, 5, 24, 11, 30) },
    ];
    expect(findOverlap(target, others)).toBeNull();
  });

  it("detects a partial overlap", () => {
    const others = [{ start: Date.UTC(2026, 5, 24, 10, 15), end: Date.UTC(2026, 5, 24, 10, 45) }];
    expect(findOverlap(target, others)).not.toBeNull();
  });

  it("detects an interval fully containing the target", () => {
    const others = [{ start: Date.UTC(2026, 5, 24, 9, 0), end: Date.UTC(2026, 5, 24, 12, 0) }];
    expect(findOverlap(target, others)).not.toBeNull();
  });

  it("treats touching endpoints as non-overlapping (half-open)", () => {
    const others = [
      { start: Date.UTC(2026, 5, 24, 9, 30), end: Date.UTC(2026, 5, 24, 10, 0) }, // ends when target starts
      { start: Date.UTC(2026, 5, 24, 10, 30), end: Date.UTC(2026, 5, 24, 11, 0) }, // starts when target ends
    ];
    expect(findOverlap(target, others)).toBeNull();
  });
});

describe("generateOpenSlots", () => {
  const blocks: AvailabilityBlock[] = [{ startTime: "09:00", endTime: "12:00", locationId: 1 }];

  it("steps through a block by the appointment length", () => {
    const slots = generateOpenSlots(blocks, [], 30);
    expect(slots.map((s) => s.startTime)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
    expect(slots[0]).toEqual({ startTime: "09:00", endTime: "09:30", locationId: 1 });
  });

  it("omits slots that overlap a booked range, but keeps abutting ones", () => {
    // Booked 10:00–10:30 (in minutes-of-day): 600–630.
    const slots = generateOpenSlots(blocks, [{ start: 600, end: 630 }], 30);
    // 09:30 ends at 10:00 (abuts, kept); 10:00 overlaps (dropped); 10:30 abuts end (kept).
    expect(slots.map((s) => s.startTime)).toEqual(["09:00", "09:30", "10:30", "11:00", "11:30"]);
  });

  it("never returns a slot that runs past the block end", () => {
    const slots = generateOpenSlots(blocks, [], 45);
    expect(slots.map((s) => s.startTime)).toEqual(["09:00", "09:45", "10:30", "11:15"]);
    expect(slots.every((s) => timeToMinutes(s.endTime) <= timeToMinutes("12:00"))).toBe(true);
  });

  it("returns nothing for a non-positive duration", () => {
    expect(generateOpenSlots(blocks, [], 0)).toEqual([]);
  });

  it("returns nothing when there are no availability blocks", () => {
    expect(generateOpenSlots([], [], 30)).toEqual([]);
  });

  it("filters to the requested location, keeping location-agnostic blocks", () => {
    const multi: AvailabilityBlock[] = [
      { startTime: "09:00", endTime: "10:00", locationId: 1 },
      { startTime: "10:00", endTime: "11:00", locationId: 2 },
      { startTime: "11:00", endTime: "12:00", locationId: null }, // any location
    ];
    const loc1 = generateOpenSlots(multi, [], 60, 1);
    expect(loc1.map((s) => s.startTime)).toEqual(["09:00", "11:00"]); // location 1 + agnostic
    const loc2 = generateOpenSlots(multi, [], 60, 2);
    expect(loc2.map((s) => s.startTime)).toEqual(["10:00", "11:00"]); // location 2 + agnostic
    const any = generateOpenSlots(multi, [], 60);
    expect(any.map((s) => s.startTime)).toEqual(["09:00", "10:00", "11:00"]); // no filter
  });
});
