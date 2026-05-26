import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  boolean,
  json,
  tinyint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * PATIENT MANAGEMENT
 */
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).unique(), // Elation API ID
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: date("dateOfBirth"),
  gender: mysqlEnum("gender", ["M", "F", "Other", "Unknown"]),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 10 }),
  ssn: varchar("ssn", { length: 11 }), // Encrypted in production
  mrn: varchar("mrn", { length: 50 }).unique(), // Medical Record Number
  status: mysqlEnum("status", ["active", "inactive", "deceased"]).default("active"),
  profilePhotoUrl: text("profilePhotoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export const patientInsurance = mysqlTable("patientInsurance", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  insuranceProvider: varchar("insuranceProvider", { length: 255 }).notNull(),
  memberId: varchar("memberId", { length: 100 }).notNull(),
  groupNumber: varchar("groupNumber", { length: 100 }),
  planName: varchar("planName", { length: 255 }),
  effectiveDate: date("effectiveDate"),
  terminationDate: date("terminationDate"),
  isPrimary: boolean("isPrimary").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientInsurance = typeof patientInsurance.$inferSelect;
export type InsertPatientInsurance = typeof patientInsurance.$inferInsert;

export const providerTeams = mysqlTable("providerTeams", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId"),
  providerName: varchar("providerName", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  role: varchar("role", { length: 50 }), // PCP, Specialist, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderTeam = typeof providerTeams.$inferSelect;
export type InsertProviderTeam = typeof providerTeams.$inferInsert;

/**
 * CLINICAL CHART
 */
export const problems = mysqlTable("problems", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  icdCode: varchar("icdCode", { length: 20 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "resolved"]).default("active"),
  onsetDate: date("onsetDate"),
  resolutionDate: date("resolutionDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Problem = typeof problems.$inferSelect;
export type InsertProblem = typeof problems.$inferInsert;

export const allergies = mysqlTable("allergies", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  allergen: varchar("allergen", { length: 255 }).notNull(),
  allergenType: mysqlEnum("allergenType", ["medication", "food", "environmental", "other"]),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe"]),
  reaction: text("reaction"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  onsetDate: date("onsetDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = typeof allergies.$inferInsert;

export const drugIntolerances = mysqlTable("drugIntolerances", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  drugName: varchar("drugName", { length: 255 }).notNull(),
  rxNorm: varchar("rxNorm", { length: 20 }),
  reaction: text("reaction"),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe"]),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  onsetDate: date("onsetDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrugIntolerance = typeof drugIntolerances.$inferSelect;
export type InsertDrugIntolerance = typeof drugIntolerances.$inferInsert;

export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  rxNorm: varchar("rxNorm", { length: 20 }),
  dosage: varchar("dosage", { length: 100 }),
  route: varchar("route", { length: 50 }), // oral, IV, topical, etc.
  frequency: varchar("frequency", { length: 100 }), // twice daily, etc.
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["active", "discontinued", "on-hold"]).default("active"),
  prescriber: varchar("prescriber", { length: 255 }),
  indication: text("indication"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

export const immunizations = mysqlTable("immunizations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  vaccineName: varchar("vaccineName", { length: 255 }).notNull(),
  cvxCode: varchar("cvxCode", { length: 10 }),
  administrationDate: date("administrationDate").notNull(),
  route: varchar("route", { length: 50 }),
  site: varchar("site", { length: 50 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  lotNumber: varchar("lotNumber", { length: 100 }),
  nextDueDate: date("nextDueDate"),
  provider: varchar("provider", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Immunization = typeof immunizations.$inferSelect;
export type InsertImmunization = typeof immunizations.$inferInsert;

export const familyHistories = mysqlTable("familyHistories", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  relation: varchar("relation", { length: 50 }).notNull(), // mother, father, sibling, etc.
  condition: varchar("condition", { length: 255 }).notNull(),
  icdCode: varchar("icdCode", { length: 20 }),
  ageOfOnset: int("ageOfOnset"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyHistory = typeof familyHistories.$inferSelect;
export type InsertFamilyHistory = typeof familyHistories.$inferInsert;

export const medicalHistories = mysqlTable("medicalHistories", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  historyType: varchar("historyType", { length: 100 }).notNull(), // smoking, alcohol, etc.
  status: varchar("status", { length: 50 }),
  details: text("details"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalHistory = typeof medicalHistories.$inferSelect;
export type InsertMedicalHistory = typeof medicalHistories.$inferInsert;

/**
 * VISIT NOTES & CLINICAL DOCUMENTS
 */
export const visitNotes = mysqlTable("visitNotes", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  visitDate: date("visitDate").notNull(),
  visitType: varchar("visitType", { length: 100 }),
  provider: varchar("provider", { length: 255 }),
  chief_complaint: text("chief_complaint"),
  history_of_present_illness: text("history_of_present_illness"),
  review_of_systems: text("review_of_systems"),
  past_medical_history: text("past_medical_history"),
  past_surgical_history: text("past_surgical_history"),
  medications_review: text("medications_review"),
  allergies_review: text("allergies_review"),
  physical_exam: text("physical_exam"),
  assessment: text("assessment"),
  plan: text("plan"),
  status: mysqlEnum("status", ["draft", "completed", "signed"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisitNote = typeof visitNotes.$inferSelect;
export type InsertVisitNote = typeof visitNotes.$inferInsert;

export const vitals = mysqlTable("vitals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  recordDate: timestamp("recordDate").notNull(),
  systolicBP: int("systolicBP"),
  diastolicBP: int("diastolicBP"),
  heartRate: int("heartRate"),
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // Fahrenheit
  respiratoryRate: int("respiratoryRate"),
  weight: decimal("weight", { precision: 8, scale: 2 }), // kg
  height: decimal("height", { precision: 8, scale: 2 }), // cm
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  oxygenSaturation: decimal("oxygenSaturation", { precision: 5, scale: 2 }), // %
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vital = typeof vitals.$inferSelect;
export type InsertVital = typeof vitals.$inferInsert;

export const clinicalDocuments = mysqlTable("clinicalDocuments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  documentType: varchar("documentType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  documentDate: date("documentDate"),
  provider: varchar("provider", { length: 255 }),
  content: text("content"),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", ["draft", "final", "archived"]).default("final"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalDocument = typeof clinicalDocuments.$inferSelect;
export type InsertClinicalDocument = typeof clinicalDocuments.$inferInsert;

export const nonVisitNotes = mysqlTable("nonVisitNotes", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  noteDate: date("noteDate").notNull(),
  noteType: varchar("noteType", { length: 100 }),
  content: text("content").notNull(),
  author: varchar("author", { length: 255 }),
  status: mysqlEnum("status", ["draft", "completed", "signed"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NonVisitNote = typeof nonVisitNotes.$inferSelect;
export type InsertNonVisitNote = typeof nonVisitNotes.$inferInsert;

/**
 * ORDERS
 */
export const labOrders = mysqlTable("labOrders", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  orderDate: date("orderDate").notNull(),
  provider: varchar("provider", { length: 255 }),
  labVendor: varchar("labVendor", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending"),
  specimenCollectionDate: date("specimenCollectionDate"),
  resultDate: date("resultDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabOrder = typeof labOrders.$inferSelect;
export type InsertLabOrder = typeof labOrders.$inferInsert;

export const labOrderTests = mysqlTable("labOrderTests", {
  id: int("id").autoincrement().primaryKey(),
  labOrderId: int("labOrderId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  loincCode: varchar("loincCode", { length: 20 }),
  result: text("result"),
  referenceRange: varchar("referenceRange", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabOrderTest = typeof labOrderTests.$inferSelect;
export type InsertLabOrderTest = typeof labOrderTests.$inferInsert;

export const imagingOrders = mysqlTable("imagingOrders", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  orderDate: date("orderDate").notNull(),
  provider: varchar("provider", { length: 255 }),
  imagingCenter: varchar("imagingCenter", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImagingOrder = typeof imagingOrders.$inferSelect;
export type InsertImagingOrder = typeof imagingOrders.$inferInsert;

export const cardiacOrders = mysqlTable("cardiacOrders", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  orderDate: date("orderDate").notNull(),
  provider: varchar("provider", { length: 255 }),
  cardiacCenter: varchar("cardiacCenter", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardiacOrder = typeof cardiacOrders.$inferSelect;
export type InsertCardiacOrder = typeof cardiacOrders.$inferInsert;

/**
 * SCHEDULING & APPOINTMENTS
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  duration: int("duration"), // minutes
  provider: varchar("provider", { length: 255 }),
  appointmentType: varchar("appointmentType", { length: 100 }),
  location: varchar("location", { length: 255 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no-show"]).default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * DOCUMENTS & REPORTS
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  reportDate: date("reportDate"),
  provider: varchar("provider", { length: 255 }),
  content: text("content"),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", ["draft", "final", "archived"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export const reportInternalNotes = mysqlTable("reportInternalNotes", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  content: text("content").notNull(),
  author: varchar("author", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportInternalNote = typeof reportInternalNotes.$inferSelect;
export type InsertReportInternalNote = typeof reportInternalNotes.$inferInsert;

export const documentTags = mysqlTable("documentTags", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  documentType: varchar("documentType", { length: 50 }).notNull(), // report, clinical_document, etc.
  tag: varchar("tag", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentTag = typeof documentTags.$inferSelect;
export type InsertDocumentTag = typeof documentTags.$inferInsert;

/**
 * REFERRALS & LETTERS
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  referralDate: date("referralDate").notNull(),
  referringProvider: varchar("referringProvider", { length: 255 }),
  referredTo: varchar("referredTo", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "accepted", "completed", "cancelled"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

export const patientLetters = mysqlTable("patientLetters", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  letterDate: date("letterDate").notNull(),
  letterType: varchar("letterType", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  recipient: varchar("recipient", { length: 255 }),
  content: text("content"),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", ["draft", "sent", "archived"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientLetter = typeof patientLetters.$inferSelect;
export type InsertPatientLetter = typeof patientLetters.$inferInsert;

/**
 * PRESCRIPTIONS & REFILLS
 */
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  rxNorm: varchar("rxNorm", { length: 20 }),
  dosage: varchar("dosage", { length: 100 }),
  quantity: int("quantity"),
  refills: int("refills"),
  prescriptionDate: date("prescriptionDate").notNull(),
  prescriber: varchar("prescriber", { length: 255 }),
  status: mysqlEnum("status", ["active", "filled", "expired", "cancelled"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

export const prescriptionFills = mysqlTable("prescriptionFills", {
  id: int("id").autoincrement().primaryKey(),
  prescriptionId: int("prescriptionId").notNull(),
  fillDate: date("fillDate").notNull(),
  pharmacy: varchar("pharmacy", { length: 255 }),
  quantity: int("quantity"),
  daysSupply: int("daysSupply"),
  status: mysqlEnum("status", ["filled", "pending", "cancelled"]).default("filled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrescriptionFill = typeof prescriptionFills.$inferSelect;
export type InsertPrescriptionFill = typeof prescriptionFills.$inferInsert;

export const prescriptionRefills = mysqlTable("prescriptionRefills", {
  id: int("id").autoincrement().primaryKey(),
  prescriptionId: int("prescriptionId").notNull(),
  refillDate: date("refillDate").notNull(),
  requestedBy: varchar("requestedBy", { length: 255 }),
  status: mysqlEnum("status", ["pending", "approved", "denied"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrescriptionRefill = typeof prescriptionRefills.$inferSelect;
export type InsertPrescriptionRefill = typeof prescriptionRefills.$inferInsert;

/**
 * CARE GAPS & QUALITY MEASURES
 */
export const careGapDefinitions = mysqlTable("careGapDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  gapName: varchar("gapName", { length: 255 }).notNull(),
  description: text("description"),
  criteria: text("criteria"),
  measureType: varchar("measureType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CareGapDefinition = typeof careGapDefinitions.$inferSelect;
export type InsertCareGapDefinition = typeof careGapDefinitions.$inferInsert;

export const careGaps = mysqlTable("careGaps", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  gapDefinitionId: int("gapDefinitionId"),
  gapName: varchar("gapName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open"),
  closedDate: date("closedDate"),
  closureReason: text("closureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CareGap = typeof careGaps.$inferSelect;
export type InsertCareGap = typeof careGaps.$inferInsert;

/**
 * PATIENT FORMS
 */
export const patientForms = mysqlTable("patientForms", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  formName: varchar("formName", { length: 255 }).notNull(),
  formType: varchar("formType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientForm = typeof patientForms.$inferSelect;
export type InsertPatientForm = typeof patientForms.$inferInsert;

export const patientFormRequests = mysqlTable("patientFormRequests", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  formName: varchar("formName", { length: 255 }).notNull(),
  requestDate: date("requestDate").notNull(),
  dueDate: date("dueDate"),
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientFormRequest = typeof patientFormRequests.$inferSelect;
export type InsertPatientFormRequest = typeof patientFormRequests.$inferInsert;

export const patientFormSubmissions = mysqlTable("patientFormSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  patientFormRequestId: int("patientFormRequestId").notNull(),
  submissionDate: date("submissionDate").notNull(),
  formData: json("formData"),
  status: mysqlEnum("status", ["submitted", "reviewed", "approved"]).default("submitted"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientFormSubmission = typeof patientFormSubmissions.$inferSelect;
export type InsertPatientFormSubmission = typeof patientFormSubmissions.$inferInsert;

/**
 * MEDICAL INTAKE
 */
export const medicalIntakes = mysqlTable("medicalIntakes", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  intakeDate: timestamp("intakeDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "reviewed"]).default("in_progress"),
  chiefComplaint: text("chiefComplaint"),
  presentingProblem: text("presentingProblem"),
  symptomOnset: varchar("symptomOnset", { length: 255 }),
  symptomSeverity: mysqlEnum("symptomSeverity", ["mild", "moderate", "severe"]),
  associatedSymptoms: json("associatedSymptoms"), // Array of symptoms
  medicalHistory: text("medicalHistory"),
  surgicalHistory: text("surgicalHistory"),
  familyHistory: text("familyHistory"),
  socialHistory: text("socialHistory"),
  allergies: text("allergies"),
  currentMedications: json("currentMedications"), // Array of medications
  reviewedBy: varchar("reviewedBy", { length: 255 }),
  reviewedAt: timestamp("reviewedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalIntake = typeof medicalIntakes.$inferSelect;
export type InsertMedicalIntake = typeof medicalIntakes.$inferInsert;

export const intakeChatMessages = mysqlTable("intakeChatMessages", {
  id: int("id").autoincrement().primaryKey(),
  medicalIntakeId: int("medicalIntakeId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["question", "response", "symptom_collected", "history_collected"]).default("response"),
  extractedData: json("extractedData"), // Structured data extracted from response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntakeChatMessage = typeof intakeChatMessages.$inferSelect;
export type InsertIntakeChatMessage = typeof intakeChatMessages.$inferInsert;

export const intakeSymptoms = mysqlTable("intakeSymptoms", {
  id: int("id").autoincrement().primaryKey(),
  medicalIntakeId: int("medicalIntakeId").notNull(),
  symptom: varchar("symptom", { length: 255 }).notNull(),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe"]).default("moderate"),
  duration: varchar("duration", { length: 255 }),
  onset: varchar("onset", { length: 255 }),
  associatedFactors: text("associatedFactors"),
  relievingFactors: text("relievingFactors"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntakeSymptom = typeof intakeSymptoms.$inferSelect;
export type InsertIntakeSymptom = typeof intakeSymptoms.$inferInsert;
