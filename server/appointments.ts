import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { appointments, InsertAppointment } from "../drizzle/schema";

/**
 * APPOINTMENTS QUERIES
 */
export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(appointments).values(data);
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(appointments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(appointments).where(eq(appointments.id, id));
}

export async function getPatientAppointments(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.appointmentDate))
    .limit(limit);
}

export async function getPatientUpcomingAppointments(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  return await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.patientId, patientId), gte(appointments.appointmentDate, now)))
    .orderBy(appointments.appointmentDate)
    .limit(limit);
}

export async function getPatientPastAppointments(patientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  return await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.patientId, patientId), lte(appointments.appointmentDate, now)))
    .orderBy(desc(appointments.appointmentDate))
    .limit(limit);
}

export async function getAppointmentsByDateRange(
  patientId: number,
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.patientId, patientId),
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate)
      )
    )
    .orderBy(appointments.appointmentDate)
    .limit(limit);
}
