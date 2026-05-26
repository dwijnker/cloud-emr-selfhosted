import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { visitNotes, InsertVisitNote } from "../drizzle/schema";

/**
 * VISIT NOTES QUERIES
 */
export async function createVisitNote(data: InsertVisitNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(visitNotes).values(data);
}

export async function getVisitNoteById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(visitNotes).where(eq(visitNotes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateVisitNote(id: number, data: Partial<InsertVisitNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(visitNotes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(visitNotes.id, id));
}

export async function deleteVisitNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(visitNotes).where(eq(visitNotes.id, id));
}

export async function getPatientVisitNotes(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(visitNotes)
    .where(eq(visitNotes.patientId, patientId))
    .orderBy(desc(visitNotes.visitDate))
    .limit(limit);
}

export async function getPatientLatestVisitNote(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(visitNotes)
    .where(eq(visitNotes.patientId, patientId))
    .orderBy(desc(visitNotes.visitDate))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}
