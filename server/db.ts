import { eq, like, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  patients,
  InsertPatient,
  patientInsurance,
  InsertPatientInsurance,
  providerTeams,
  InsertProviderTeam,
  problems,
  InsertProblem,
  allergies,
  InsertAllergy,
  medications,
  InsertMedication,
  vitals,
  InsertVital,
  visitNotes,
  InsertVisitNote,
  appointments,
  InsertAppointment,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash;
      updateSet.passwordHash = user.passwordHash;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * PATIENT QUERIES
 */
export async function createPatient(data: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(patients).values(data);
  return result;
}

export async function getPatientById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPatientByMRN(mrn: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(patients).where(eq(patients.mrn, mrn)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchPatients(
  query: string,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searchPattern = `%${query}%`;
  const result = await db
    .select()
    .from(patients)
    .where(
      query
        ? and(
            eq(patients.status, "active"),
            like(patients.firstName, searchPattern)
          )
        : eq(patients.status, "active")
    )
    .orderBy(desc(patients.updatedAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function updatePatient(id: number, data: Partial<InsertPatient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(patients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patients.id, id));

  return result;
}

export async function deletePatient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Soft delete
  const result = await db
    .update(patients)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(patients.id, id));

  return result;
}

export async function listPatients(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.status, "active"))
    .orderBy(desc(patients.updatedAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * PATIENT INSURANCE QUERIES
 */
export async function createPatientInsurance(data: InsertPatientInsurance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(patientInsurance).values(data);
}

export async function getPatientInsurance(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(patientInsurance)
    .where(eq(patientInsurance.patientId, patientId));
}

/**
 * PROVIDER TEAM QUERIES
 */
export async function createProviderTeam(data: InsertProviderTeam) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(providerTeams).values(data);
}

export async function getPatientProviderTeam(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(providerTeams)
    .where(eq(providerTeams.patientId, patientId));
}

/**
 * CLINICAL DATA QUERIES
 */
export async function getPatientProblems(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(problems)
    .where(eq(problems.patientId, patientId))
    .orderBy(desc(problems.updatedAt));
}

export async function getPatientAllergies(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(allergies)
    .where(eq(allergies.patientId, patientId))
    .orderBy(desc(allergies.updatedAt));
}

export async function getPatientMedications(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(medications)
    .where(eq(medications.patientId, patientId))
    .orderBy(desc(medications.updatedAt));
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
