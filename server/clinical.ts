import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  problems,
  InsertProblem,
  allergies,
  InsertAllergy,
  medications,
  InsertMedication,
  immunizations,
  InsertImmunization,
} from "../drizzle/schema";

/**
 * PROBLEMS QUERIES
 */
export async function createProblem(data: InsertProblem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(problems).values(data);
}

export async function getProblemById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProblem(id: number, data: Partial<InsertProblem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(problems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(problems.id, id));
}

export async function deleteProblem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(problems).where(eq(problems.id, id));
}

export async function getPatientActiveProblems(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(problems)
    .where(and(eq(problems.patientId, patientId), eq(problems.status, "active")))
    .orderBy(problems.description);
}

/**
 * ALLERGIES QUERIES
 */
export async function createAllergy(data: InsertAllergy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(allergies).values(data);
}

export async function getAllergyById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(allergies).where(eq(allergies.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAllergy(id: number, data: Partial<InsertAllergy>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(allergies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(allergies.id, id));
}

export async function deleteAllergy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(allergies).where(eq(allergies.id, id));
}

export async function getPatientAllergies(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(allergies)
    .where(eq(allergies.patientId, patientId))
    .orderBy(allergies.allergen);
}

/**
 * MEDICATIONS QUERIES
 */
export async function createMedication(data: InsertMedication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(medications).values(data);
}

export async function getMedicationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateMedication(id: number, data: Partial<InsertMedication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(medications)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(medications.id, id));
}

export async function deleteMedication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(medications).where(eq(medications.id, id));
}

export async function getPatientActiveMedications(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(medications)
    .where(and(eq(medications.patientId, patientId), eq(medications.status, "active")))
    .orderBy(medications.medicationName);
}

export async function getPatientAllMedications(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(medications)
    .where(eq(medications.patientId, patientId))
    .orderBy(medications.medicationName);
}

/**
 * IMMUNIZATIONS QUERIES
 */
export async function createImmunization(data: InsertImmunization) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(immunizations).values(data);
}

export async function getImmunizationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(immunizations).where(eq(immunizations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateImmunization(id: number, data: Partial<InsertImmunization>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(immunizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(immunizations.id, id));
}

export async function deleteImmunization(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(immunizations).where(eq(immunizations.id, id));
}

export async function getPatientImmunizations(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(immunizations)
    .where(eq(immunizations.patientId, patientId))
    .orderBy(immunizations.vaccineName);
}
