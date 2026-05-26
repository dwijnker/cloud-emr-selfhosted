import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  clinicalDocuments,
  documentTags,
  reportInternalNotes,
  patientLetters,
  referrals,
} from "../drizzle/schema";

// Clinical Documents
export async function createClinicalDocument(data: {
  patientId: number;
  documentType: string;
  title: string;
  content: string;
  documentDate: Date;
  provider?: string;
  status?: "draft" | "final" | "archived";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(clinicalDocuments).values({
    patientId: data.patientId,
    documentType: data.documentType,
    title: data.title,
    content: data.content,
    documentDate: data.documentDate,
    provider: data.provider,
    status: data.status || "final",
  });
}

export async function getPatientDocuments(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(clinicalDocuments)
    .where(eq(clinicalDocuments.patientId, patientId))
    .limit(limit);
}

export async function getClinicalDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(clinicalDocuments)
    .where(eq(clinicalDocuments.id, id))
    .limit(1);

  return result[0];
}

export async function updateClinicalDocument(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    status: "draft" | "final" | "archived";
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(clinicalDocuments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clinicalDocuments.id, id));
}

export async function deleteClinicalDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(clinicalDocuments).where(eq(clinicalDocuments.id, id));
}

// Document Tags
export async function addDocumentTag(documentId: number, documentType: string, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(documentTags).values({
    documentId,
    documentType,
    tag,
  });
}

export async function getDocumentTags(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(documentTags)
    .where(eq(documentTags.documentId, documentId));
}

export async function removeDocumentTag(documentId: number, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(documentTags)
    .where(
      eq(documentTags.documentId, documentId) && eq(documentTags.tag, tag)
    );
}

// Internal Notes
export async function createInternalNote(data: {
  reportId: number;
  content: string;
  author?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(reportInternalNotes).values({
    reportId: data.reportId,
    content: data.content,
    author: data.author,
  });
}

export async function getPatientInternalNotes(reportId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(reportInternalNotes)
    .where(eq(reportInternalNotes.reportId, reportId))
    .limit(limit);
}

export async function deleteInternalNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(reportInternalNotes).where(eq(reportInternalNotes.id, id));
}

// Patient Letters
export async function createPatientLetter(data: {
  patientId: number;
  letterType: string;
  letterDate: Date;
  category?: string;
  recipient?: string;
  content?: string;
  status?: "draft" | "sent" | "archived";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(patientLetters).values({
    patientId: data.patientId,
    letterType: data.letterType,
    letterDate: data.letterDate,
    category: data.category,
    recipient: data.recipient,
    content: data.content,
    status: (data.status || "draft") as any,
  });
}

export async function getPatientLetters(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(patientLetters)
    .where(eq(patientLetters.patientId, patientId))
    .limit(limit);
}

export async function deletePatientLetter(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(patientLetters).where(eq(patientLetters.id, id));
}

// Referrals
export async function createReferral(data: {
  patientId: number;
  referralType?: string;
  specialty: string;
  referralDate: Date;
  status: "pending" | "accepted" | "completed" | "cancelled";
  referringProvider?: string;
  referredTo: string;
  reason?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(referrals).values({
    patientId: data.patientId,
    specialty: data.specialty,
    referralDate: data.referralDate,
    status: data.status as any,
    referringProvider: data.referringProvider,
    referredTo: data.referredTo,
    reason: data.reason,
    notes: data.notes,
  });
}

export async function getPatientReferrals(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(referrals)
    .where(eq(referrals.patientId, patientId))
    .limit(limit);
}

export async function getReferralById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.id, id))
    .limit(1);

  return result[0];
}

export async function updateReferral(
  id: number,
  data: Partial<{
    status: "pending" | "accepted" | "completed" | "cancelled";
    notes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(referrals)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(referrals.id, id));
}

export async function deleteReferral(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(referrals).where(eq(referrals.id, id));
}
