import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  prescriptions,
  prescriptionFills,
  prescriptionRefills,
  careGapDefinitions,
  patientForms,
  patientFormSubmissions,
} from "../drizzle/schema";

// Prescriptions
export async function createPrescription(data: {
  patientId: number;
  medicationName: string;
  dosage?: string;
  prescriptionDate: Date;
  prescriber?: string;
  status?: "active" | "filled" | "expired" | "cancelled";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(prescriptions).values({
    patientId: data.patientId,
    medicationName: data.medicationName,
    dosage: data.dosage,
    prescriptionDate: data.prescriptionDate,
    prescriber: data.prescriber,
    status: (data.status || "active") as any,
  });
}

export async function getPatientPrescriptions(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .limit(limit);
}

export async function getPrescriptionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, id))
    .limit(1);

  return result[0];
}

export async function updatePrescription(
  id: number,
  data: Partial<{
    status: "active" | "filled" | "expired" | "cancelled";
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(prescriptions)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(prescriptions.id, id));
}

export async function deletePrescription(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(prescriptions).where(eq(prescriptions.id, id));
}

// Prescription Fills
export async function createPrescriptionFill(data: {
  prescriptionId: number;
  quantity: number;
  pharmacy?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(prescriptionFills).values({
    prescriptionId: data.prescriptionId,
    quantity: data.quantity,
    pharmacy: data.pharmacy,
  } as any);
}

export async function getPrescriptionFills(prescriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(prescriptionFills)
    .where(eq(prescriptionFills.prescriptionId, prescriptionId));
}

// Prescription Refills
export async function createPrescriptionRefill(data: {
  prescriptionId: number;
  refillDate: Date;
  status?: "pending" | "approved" | "denied";
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(prescriptionRefills).values({
    prescriptionId: data.prescriptionId,
    refillDate: data.refillDate,
    status: (data.status || "pending") as any,
    notes: data.notes,
  });
}

export async function getPrescriptionRefills(prescriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(prescriptionRefills)
    .where(eq(prescriptionRefills.prescriptionId, prescriptionId));
}

// Care Gap Definitions
export async function createCareGapDefinition(data: {
  gapName: string;
  description?: string;
  measureType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(careGapDefinitions).values({
    gapName: data.gapName,
    description: data.description,
    measureType: data.measureType,
  } as any);
}

export async function getCareGapDefinitions(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(careGapDefinitions).limit(limit);
}

// Patient Forms
export async function createPatientForm(data: {
  patientId: number;
  formName: string;
  formType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(patientForms).values({
    patientId: data.patientId,
    formName: data.formName,
    formType: data.formType,
  });
}

export async function getPatientForms(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(patientForms)
    .where(eq(patientForms.patientId, patientId))
    .limit(limit);
}

export async function updatePatientForm(
  id: number,
  data: Partial<{
    formName: string;
    formType: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(patientForms)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patientForms.id, id));
}

export async function deletePatientForm(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(patientForms).where(eq(patientForms.id, id));
}

// Form Submissions
export async function createFormSubmission(data: {
  patientFormRequestId: number;
  submissionDate: Date;
  formData?: Record<string, any>;
  status?: "submitted" | "reviewed" | "approved";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(patientFormSubmissions).values({
    patientFormRequestId: data.patientFormRequestId,
    submissionDate: data.submissionDate,
    formData: data.formData,
    status: (data.status || "submitted") as any,
  });
}

export async function getFormSubmissions(patientFormRequestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(patientFormSubmissions)
    .where(eq(patientFormSubmissions.patientFormRequestId, patientFormRequestId));
}

export async function updateFormSubmission(
  id: number,
  data: Partial<{
    status: "submitted" | "reviewed" | "approved";
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(patientFormSubmissions)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(patientFormSubmissions.id, id));
}
