import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import { vitals, InsertVital } from "../drizzle/schema";

/**
 * VITALS QUERIES
 */
export async function createVital(data: InsertVital) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(vitals).values(data as any);
}

export async function getVitalById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(vitals).where(eq(vitals.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateVital(
  id: number,
  data: Partial<{
    systolicBP?: number;
    diastolicBP?: number;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    oxygenSaturation?: number;
    notes?: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(vitals)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(vitals.id, id));
}

export async function deleteVital(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(vitals).where(eq(vitals.id, id));
}

export async function getPatientVitals(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(vitals)
    .where(eq(vitals.patientId, patientId))
    .orderBy(desc(vitals.recordDate))
    .limit(limit);
}

export async function getPatientLatestVital(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(vitals)
    .where(eq(vitals.patientId, patientId))
    .orderBy(desc(vitals.recordDate))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPatientVitalsByDateRange(
  patientId: number,
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(vitals)
    .where(
      and(
        eq(vitals.patientId, patientId),
        // Assuming recordDate is stored as timestamp
      )
    )
    .orderBy(desc(vitals.recordDate))
    .limit(limit);
}
