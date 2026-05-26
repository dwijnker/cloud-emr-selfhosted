import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  labOrders,
  labOrderTests,
  imagingOrders,
  cardiacOrders,
} from "../drizzle/schema";

// Lab Orders
export async function createLabOrder(data: {
  patientId: number;
  orderDate: Date;
  status: "pending" | "completed" | "cancelled";
  provider?: string;
  labVendor?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(labOrders).values({
    patientId: data.patientId,
    orderDate: data.orderDate,
    status: data.status as any,
    provider: data.provider,
    labVendor: data.labVendor,
    notes: data.notes,
  });

  return result;
}

export async function getPatientLabOrders(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labOrders)
    .where(eq(labOrders.patientId, patientId))
    .limit(limit);
}

export async function getLabOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(labOrders)
    .where(eq(labOrders.id, id))
    .limit(1);

  return result[0];
}

export async function updateLabOrder(
  id: number,
  data: Partial<{
    status: "pending" | "completed" | "cancelled";
    notes: string;
    facility: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(labOrders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(labOrders.id, id));
}

export async function deleteLabOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(labOrders).where(eq(labOrders.id, id));
}

// Lab Order Tests
export async function createLabOrderTest(data: {
  labOrderId: number;
  testName: string;
  loincCode?: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(labOrderTests).values({
    labOrderId: data.labOrderId,
    testName: data.testName,
    loincCode: data.loincCode,
    result: data.result,
    unit: data.unit,
    referenceRange: data.referenceRange,
  });
}

export async function getLabOrderTests(labOrderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labOrderTests)
    .where(eq(labOrderTests.labOrderId, labOrderId));
}

// Imaging Orders
export async function createImagingOrder(data: {
  patientId: number;
  orderDate: Date;
  status: "pending" | "completed" | "cancelled";
  provider?: string;
  imagingCenter?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(imagingOrders).values({
    patientId: data.patientId,
    orderDate: data.orderDate,
    status: data.status as any,
    provider: data.provider,
    imagingCenter: data.imagingCenter,
    notes: data.notes,
  });
}

export async function getPatientImagingOrders(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(imagingOrders)
    .where(eq(imagingOrders.patientId, patientId))
    .limit(limit);
}

export async function deleteImagingOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(imagingOrders).where(eq(imagingOrders.id, id));
}

// Cardiac Orders
export async function createCardiacOrder(data: {
  patientId: number;
  orderDate: Date;
  status: "pending" | "completed" | "cancelled";
  provider?: string;
  cardiacCenter?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(cardiacOrders).values({
    patientId: data.patientId,
    orderDate: data.orderDate,
    status: data.status as any,
    provider: data.provider,
    cardiacCenter: data.cardiacCenter,
    notes: data.notes,
  });
}

export async function getPatientCardiacOrders(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(cardiacOrders)
    .where(eq(cardiacOrders.patientId, patientId))
    .limit(limit);
}

export async function deleteCardiacOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(cardiacOrders).where(eq(cardiacOrders.id, id));
}
