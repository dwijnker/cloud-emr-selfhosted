import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  medicalIntakes,
  intakeChatMessages,
  intakeSymptoms,
  InsertMedicalIntake,
  InsertIntakeChatMessage,
  InsertIntakeSymptom,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new medical intake session for a patient
 */
export async function createMedicalIntake(
  patientId: number,
  data: Partial<InsertMedicalIntake>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(medicalIntakes).values({
    patientId,
    status: "in_progress",
    ...data,
  });

  return result;
}

/**
 * Get a medical intake by ID
 */
export async function getMedicalIntake(intakeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(medicalIntakes)
    .where(eq(medicalIntakes.id, intakeId))
    .limit(1);

  return result[0];
}

/**
 * Get all medical intakes for a patient
 */
export async function getPatientIntakes(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(medicalIntakes)
    .where(eq(medicalIntakes.patientId, patientId))
    .orderBy(medicalIntakes.intakeDate);
}

/**
 * Update a medical intake
 */
export async function updateMedicalIntake(
  intakeId: number,
  data: Partial<InsertMedicalIntake>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(medicalIntakes)
    .set(data)
    .where(eq(medicalIntakes.id, intakeId));
}

/**
 * Complete a medical intake
 */
export async function completeMedicalIntake(intakeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(medicalIntakes)
    .set({ status: "completed" })
    .where(eq(medicalIntakes.id, intakeId));
}

/**
 * Add a chat message to an intake session
 */
export async function addIntakeChatMessage(
  medicalIntakeId: number,
  data: Omit<InsertIntakeChatMessage, "medicalIntakeId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(intakeChatMessages).values({
    medicalIntakeId,
    ...data,
  });
}

/**
 * Get chat messages for an intake
 */
export async function getIntakeChatMessages(medicalIntakeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(intakeChatMessages)
    .where(eq(intakeChatMessages.medicalIntakeId, medicalIntakeId))
    .orderBy(intakeChatMessages.createdAt);
}

/**
 * Add a symptom to an intake
 */
export async function addIntakeSymptom(
  medicalIntakeId: number,
  data: Omit<InsertIntakeSymptom, "medicalIntakeId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(intakeSymptoms).values({
    medicalIntakeId,
    ...data,
  });
}

/**
 * Get symptoms for an intake
 */
export async function getIntakeSymptoms(medicalIntakeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(intakeSymptoms)
    .where(eq(intakeSymptoms.medicalIntakeId, medicalIntakeId));
}

/**
 * Delete a symptom
 */
export async function deleteIntakeSymptom(symptomId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(intakeSymptoms)
    .where(eq(intakeSymptoms.id, symptomId));
}
