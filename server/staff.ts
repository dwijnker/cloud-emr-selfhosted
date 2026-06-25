import { eq, and, asc, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  staff,
  locations,
  staffWeeklySchedules,
  staffScheduleExceptions,
  InsertStaff,
  InsertLocation,
  InsertStaffWeeklySchedule,
  InsertStaffScheduleException,
} from "../drizzle/schema";
import {
  getAvailabilityForDate,
  toIsoDate,
  type WeeklyBlock,
  type ScheduleException,
} from "./staffAvailability";

/**
 * STAFF QUERIES
 */
export async function createStaff(data: InsertStaff) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(staff).values(data).$returningId();
  return row;
}

export async function listStaff(includeInactive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = db.select().from(staff);
  if (includeInactive) {
    return await query.orderBy(asc(staff.lastName), asc(staff.firstName));
  }
  return await db
    .select()
    .from(staff)
    .where(eq(staff.status, "active"))
    .orderBy(asc(staff.lastName), asc(staff.firstName));
}

export async function getStaffById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateStaff(id: number, data: Partial<InsertStaff>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(staff)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(staff.id, id));
}

export async function deleteStaff(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(staff).where(eq(staff.id, id));
}

/**
 * LOCATION QUERIES
 */
export async function createLocation(data: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(locations).values(data).$returningId();
  return row;
}

export async function listLocations(includeInactive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (includeInactive) {
    return await db.select().from(locations).orderBy(asc(locations.name));
  }
  return await db
    .select()
    .from(locations)
    .where(eq(locations.status, "active"))
    .orderBy(asc(locations.name));
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLocation(id: number, data: Partial<InsertLocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(locations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(locations.id, id));
}

export async function deleteLocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(locations).where(eq(locations.id, id));
}

/**
 * WEEKLY SCHEDULE QUERIES
 */
export async function createWeeklySchedule(data: InsertStaffWeeklySchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(staffWeeklySchedules).values(data).$returningId();
  return row;
}

export async function getStaffWeeklySchedules(staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(staffWeeklySchedules)
    .where(eq(staffWeeklySchedules.staffId, staffId))
    .orderBy(asc(staffWeeklySchedules.dayOfWeek), asc(staffWeeklySchedules.startTime));
}

export async function deleteWeeklySchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(staffWeeklySchedules).where(eq(staffWeeklySchedules.id, id));
}

/**
 * SCHEDULE EXCEPTION QUERIES
 */
export async function createScheduleException(data: InsertStaffScheduleException) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(staffScheduleExceptions).values(data).$returningId();
  return row;
}

export async function getStaffScheduleExceptions(
  staffId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(staffScheduleExceptions.staffId, staffId)];
  if (startDate) conditions.push(gte(staffScheduleExceptions.date, startDate));
  if (endDate) conditions.push(lte(staffScheduleExceptions.date, endDate));
  return await db
    .select()
    .from(staffScheduleExceptions)
    .where(and(...conditions))
    .orderBy(asc(staffScheduleExceptions.date));
}

export async function deleteScheduleException(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(staffScheduleExceptions).where(eq(staffScheduleExceptions.id, id));
}

/**
 * Resolve a staff member's working blocks on a given date by combining their
 * recurring weekly template with any date-specific exceptions.
 */
export async function getStaffAvailabilityForDate(staffId: number, date: Date) {
  const [weekly, exceptions] = await Promise.all([
    getStaffWeeklySchedules(staffId),
    getStaffScheduleExceptions(staffId),
  ]);

  const weeklyBlocks: WeeklyBlock[] = weekly.map((w) => ({
    dayOfWeek: w.dayOfWeek,
    startTime: w.startTime,
    endTime: w.endTime,
    locationId: w.locationId,
  }));

  const exceptionBlocks: ScheduleException[] = exceptions.map((e) => ({
    // The `date` column may surface as a Date or a string depending on the driver.
    date: typeof e.date === "string" ? (e.date as string).slice(0, 10) : toIsoDate(e.date as Date),
    type: e.type,
    startTime: e.startTime,
    endTime: e.endTime,
    locationId: e.locationId,
  }));

  return getAvailabilityForDate(date, weeklyBlocks, exceptionBlocks);
}
