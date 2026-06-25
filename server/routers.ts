import { COOKIE_NAME } from "@shared/const";
import { lookupIcdCode } from "./icd";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPatient,
  getPatientById,
  getPatientByMRN,
  searchPatients,
  updatePatient,
  deletePatient,
  listPatients,
  createPatientInsurance,
  getPatientInsurance,
  createProviderTeam,
  getPatientProviderTeam,
  getPatientProblems,
  getPatientAllergies,
  getPatientMedications,
  getPatientVitals,
  getPatientVisitNotes,
  getPatientAppointments,
} from "./db";
import {
  createProblem,
  getProblemById,
  updateProblem,
  deleteProblem,
  getPatientActiveProblems,
  createAllergy,
  getAllergyById,
  updateAllergy,
  deleteAllergy,
  getPatientAllergies as getPatientAllergiesFromClinical,
  createMedication,
  getMedicationById,
  updateMedication,
  deleteMedication,
  getPatientActiveMedications,
  getPatientAllMedications,
  createImmunization,
  getImmunizationById,
  updateImmunization,
  deleteImmunization,
  getPatientImmunizations,
} from "./clinical";
import {
  createMedicalIntake,
  getMedicalIntake,
  getPatientIntakes,
  updateMedicalIntake,
  completeMedicalIntake,
  addIntakeChatMessage,
  getIntakeChatMessages,
  addIntakeSymptom,
  getIntakeSymptoms,
  getIntakeSymptomById,
  deleteIntakeSymptom,
} from "./intake";
import { invokeLLM } from "./_core/llm";
import {
  createLabOrder,
  getPatientLabOrders,
  deleteLabOrder,
  updateLabOrder,
  createLabOrderTest,
  getLabOrderTests,
  createImagingOrder,
  getPatientImagingOrders,
  deleteImagingOrder,
  createCardiacOrder,
  getPatientCardiacOrders,
  deleteCardiacOrder,
} from "./orders";
import {
  createClinicalDocument,
  getPatientDocuments,
  deleteClinicalDocument,
  updateClinicalDocument,
  createInternalNote,
  getPatientInternalNotes,
  deleteInternalNote,
  createPatientLetter,
  getPatientLetters,
  deletePatientLetter,
  createReferral,
  getPatientReferrals,
  updateReferral,
  deleteReferral,
} from "./documents";
import {
  createPrescription,
  getPatientPrescriptions,
  deletePrescription,
  updatePrescription,
  createPrescriptionFill,
  getPrescriptionFills,
  createPrescriptionRefill,
  getPrescriptionRefills,
  createCareGapDefinition,
  getCareGapDefinitions,
  createPatientForm,
  getPatientForms,
  updatePatientForm,
  deletePatientForm,
  createFormSubmission,
  getFormSubmissions,
  updateFormSubmission,
} from "./prescriptions";
import {
  createVital,
  getVitalById,
  updateVital,
  deleteVital,
  getPatientLatestVital,
} from "./vitals";
import {
  createVisitNote,
  getVisitNoteById,
  updateVisitNote,
  deleteVisitNote,
  getPatientLatestVisitNote,
} from "./visits";
import {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getPatientUpcomingAppointments,
  getPatientPastAppointments,
  getStaffAppointmentsByDateRange,
} from "./appointments";
import {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  createLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  createWeeklySchedule,
  getStaffWeeklySchedules,
  deleteWeeklySchedule,
  createScheduleException,
  getStaffScheduleExceptions,
  deleteScheduleException,
  getStaffAvailabilityForDate,
} from "./staff";
import {
  fitsInAvailability,
  dateToTime,
  toIsoDate,
  minutesToTime,
  timeToMinutes,
  findOverlap,
} from "./staffAvailability";

/**
 * Throws a BAD_REQUEST if the staff member is not scheduled to work during the
 * requested appointment window. Validation is done against the clinic-local
 * wall-clock day + time the user picked (`wallDate`/`wallTime`), NOT by reading
 * the absolute instant in the server's timezone — schedule blocks are stored as
 * timezone-naive wall-clock strings, so converting through server-local time
 * would reject valid slots whenever the server runs in a different zone (e.g.
 * UTC) than the booker.
 */
async function assertStaffAvailable(
  staffId: number,
  wallDate: string, // "YYYY-MM-DD"
  wallTime: string, // "HH:MM"
  durationMinutes: number,
  locationId?: number | null
) {
  // Anchor at local noon so getDay()/toIsoDate() resolve to the intended day.
  const lookupDate = new Date(`${wallDate}T12:00:00`);
  const blocks = await getStaffAvailabilityForDate(staffId, lookupDate);
  if (blocks.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This staff member is not scheduled to work on that date.",
    });
  }
  const endTime = minutesToTime(timeToMinutes(wallTime) + durationMinutes);
  if (!fitsInAvailability(blocks, wallTime, endTime, locationId ?? null)) {
    const hours = blocks.map((b) => `${b.startTime}–${b.endTime}`).join(", ");
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Outside the staff member's available hours for that day (${hours}).`,
    });
  }
}

/**
 * Throws a CONFLICT if the requested window collides with another non-cancelled
 * appointment for the same staff member. `excludeId` skips the row being edited.
 */
async function assertNoOverlap(
  staffId: number,
  appointmentDate: Date,
  durationMinutes: number,
  excludeId?: number
) {
  const start = appointmentDate.getTime();
  const end = start + durationMinutes * 60000;
  // Widen the fetch window by a day on each side so long appointments that
  // start outside the target day but overlap into it are still considered.
  const windowStart = new Date(start - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(end + 24 * 60 * 60 * 1000);

  const existing = await getStaffAppointmentsByDateRange(staffId, windowStart, windowEnd);
  const others = existing
    .filter((a) => a.id !== excludeId)
    .map((a) => {
      const otherStart = new Date(a.appointmentDate).getTime();
      return { start: otherStart, end: otherStart + (a.duration ?? 30) * 60000 };
    });

  const conflict = findOverlap({ start, end }, others);
  if (conflict) {
    const when = new Date(conflict.start).toLocaleString();
    throw new TRPCError({
      code: "CONFLICT",
      message: `This staff member already has an appointment that overlaps this time (${when}).`,
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * PATIENT MANAGEMENT
   */
  patients: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await listPatients(input.limit, input.offset);
      }),

    search: protectedProcedure
      .input(
        z.object({
          query: z.string(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await searchPatients(input.query, input.limit, input.offset);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const patient = await getPatientById(input.id);
        if (!patient) {
          throw new Error("Patient not found");
        }
        return patient;
      }),

    create: protectedProcedure
      .input(
        z.object({
          firstName: z.string(),
          lastName: z.string(),
          dateOfBirth: z.date().optional(),
          gender: z.enum(["M", "F", "Other", "Unknown"]).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          ssn: z.string().optional(),
          mrn: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.mrn) {
          const existing = await getPatientByMRN(input.mrn);
          if (existing) {
            throw new Error("Patient with this MRN already exists");
          }
        }

        return await createPatient({
          ...input,
          status: "active",
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          dateOfBirth: z.date().optional(),
          gender: z.enum(["M", "F", "Other", "Unknown"]).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          profilePhotoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePatient(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletePatient(input.id);
      }),

    getInsurance: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientInsurance(input.patientId);
      }),

    addInsurance: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          insuranceProvider: z.string(),
          memberId: z.string(),
          groupNumber: z.string().optional(),
          planName: z.string().optional(),
          effectiveDate: z.date().optional(),
          terminationDate: z.date().optional(),
          isPrimary: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        return await createPatientInsurance(input);
      }),

    getProviderTeam: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientProviderTeam(input.patientId);
      }),

    addProvider: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          providerId: z.number().optional(),
          providerName: z.string(),
          specialty: z.string().optional(),
          role: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createProviderTeam(input);
      }),
  }),

  /**
   * CLINICAL CHART
   */
  clinical: router({
    // PROBLEMS
    createProblem: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          icdCode: z.string(),
          description: z.string(),
          status: z.enum(["active", "inactive", "resolved"]).default("active"),
          onsetDate: z.date().optional(),
          resolutionDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createProblem(input);
      }),

    getProblems: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientActiveProblems(input.patientId);
      }),

    getProblemById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getProblemById(input.id);
      }),

    updateProblem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().optional(),
          status: z.enum(["active", "inactive", "resolved"]).optional(),
          resolutionDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateProblem(id, data);
      }),

    deleteProblem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteProblem(input.id);
      }),

    // ALLERGIES
    createAllergy: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          allergen: z.string(),
          severity: z.enum(["mild", "moderate", "severe"]).optional(),
          reactionType: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createAllergy(input);
      }),

    getAllergies: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientAllergiesFromClinical(input.patientId);
      }),

    getAllergyById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getAllergyById(input.id);
      }),

    updateAllergy: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          allergen: z.string().optional(),
          severity: z.enum(["mild", "moderate", "severe"]).optional(),
          reactionType: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateAllergy(id, data);
      }),

    deleteAllergy: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAllergy(input.id);
      }),

    // MEDICATIONS
    createMedication: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          medicationName: z.string(),
          dosage: z.string().optional(),
          frequency: z.string().optional(),
          route: z.string().optional(),
          status: z.enum(["active", "discontinued", "on-hold"]).default("active"),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          indication: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createMedication(input);
      }),

    getMedications: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientActiveMedications(input.patientId);
      }),

    getAllMedications: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientAllMedications(input.patientId);
      }),

    getMedicationById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getMedicationById(input.id);
      }),

    updateMedication: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          medicationName: z.string().optional(),
          dosage: z.string().optional(),
          frequency: z.string().optional(),
          status: z.enum(["active", "discontinued", "on-hold"]).optional(),
          endDate: z.date().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateMedication(id, data);
      }),

    deleteMedication: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteMedication(input.id);
      }),

    // IMMUNIZATIONS
    createImmunization: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          vaccineName: z.string(),
          administrationDate: z.date(),
          lot: z.string().optional(),
          site: z.string().optional(),
          route: z.string().optional(),
          manufacturer: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createImmunization(input);
      }),

    getImmunizations: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientImmunizations(input.patientId);
      }),

    getImmunizationById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getImmunizationById(input.id);
      }),

    updateImmunization: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          vaccineName: z.string().optional(),
          administrationDate: z.date().optional(),
          lot: z.string().optional(),
          site: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateImmunization(id, data);
      }),

    deleteImmunization: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteImmunization(input.id);
      }),
  }),

  /**
   * VITALS
   */
  vitals: router({
    createVital: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          recordDate: z.date(),
          systolicBP: z.number().optional(),
          diastolicBP: z.number().optional(),
          heartRate: z.number().optional(),
          temperature: z.number().optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
          bmi: z.number().optional(),
          oxygenSaturation: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createVital(input as any);
      }),

    getVitals: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientVitals(input.patientId, input.limit);
      }),

    getLatestVital: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientLatestVital(input.patientId);
      }),

    getVitalById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getVitalById(input.id);
      }),

    updateVital: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          systolicBP: z.number().optional(),
          diastolicBP: z.number().optional(),
          heartRate: z.number().optional(),
          temperature: z.number().optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
          bmi: z.number().optional(),
          oxygenSaturation: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateVital(id, data);
      }),

    deleteVital: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteVital(input.id);
      }),
  }),

  /**
   * VISIT NOTES
   */
  visits: router({
    createVisitNote: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          visitDate: z.date(),
          chiefComplaint: z.string().optional(),
          historyOfPresentIllness: z.string().optional(),
          reviewOfSystems: z.string().optional(),
          physicalExam: z.string().optional(),
          assessment: z.string().optional(),
          plan: z.string().optional(),
          status: z.enum(["draft", "completed", "signed"]).default("draft"),
          provider: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createVisitNote(input);
      }),

    getVisitNotes: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientVisitNotes(input.patientId, input.limit);
      }),

    getVisitNoteById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getVisitNoteById(input.id);
      }),

    updateVisitNote: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          chiefComplaint: z.string().optional(),
          historyOfPresentIllness: z.string().optional(),
          reviewOfSystems: z.string().optional(),
          physicalExam: z.string().optional(),
          assessment: z.string().optional(),
          plan: z.string().optional(),
          status: z.enum(["draft", "completed", "signed"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateVisitNote(id, data);
      }),

    deleteVisitNote: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteVisitNote(input.id);
      }),
  }),

  /**
   * APPOINTMENTS
   */
  appointments: router({
    createAppointment: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          appointmentDate: z.date(),
          appointmentType: z.string().optional(),
          staffId: z.number().optional(),
          locationId: z.number().optional(),
          provider: z.string().optional(),
          location: z.string().optional(),
          duration: z.number().optional(),
          status: z.enum(["scheduled", "completed", "cancelled", "no-show"]).default("scheduled"),
          notes: z.string().optional(),
          // Clinic-local wall-clock the user picked, used for availability checks
          // (validation-only; not persisted).
          scheduleDate: z.string().optional(), // "YYYY-MM-DD"
          scheduleTime: z.string().optional(), // "HH:MM"
        })
      )
      .mutation(async ({ input }) => {
        const { scheduleDate, scheduleTime, ...data } = input;
        if (data.staffId) {
          const wallDate = scheduleDate ?? toIsoDate(data.appointmentDate);
          const wallTime = scheduleTime ?? dateToTime(data.appointmentDate);
          await assertStaffAvailable(data.staffId, wallDate, wallTime, data.duration ?? 30, data.locationId);
          await assertNoOverlap(data.staffId, data.appointmentDate, data.duration ?? 30);
        }
        return await createAppointment(data);
      }),

    getAppointments: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientAppointments(input.patientId, input.limit);
      }),

    getUpcomingAppointments: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientUpcomingAppointments(input.patientId, input.limit);
      }),

    getPastAppointments: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientPastAppointments(input.patientId, input.limit);
      }),

    getAppointmentById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getAppointmentById(input.id);
      }),

    // Non-cancelled appointments for a staff member on a given calendar day,
    // used client-side to hide already-booked slots.
    getStaffDaySchedule: protectedProcedure
      .input(z.object({ staffId: z.number(), date: z.date() }))
      .query(async ({ input }) => {
        const d = input.date;
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        return await getStaffAppointmentsByDateRange(input.staffId, dayStart, dayEnd);
      }),

    updateAppointment: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          appointmentDate: z.date().optional(),
          appointmentType: z.string().optional(),
          staffId: z.number().optional(),
          locationId: z.number().optional(),
          provider: z.string().optional(),
          location: z.string().optional(),
          status: z.enum(["scheduled", "completed", "cancelled", "no-show"]).optional(),
          notes: z.string().optional(),
          scheduleDate: z.string().optional(), // "YYYY-MM-DD" (validation-only)
          scheduleTime: z.string().optional(), // "HH:MM" (validation-only)
        })
      )
      .mutation(async ({ input }) => {
        const { id, scheduleDate, scheduleTime, ...data } = input;
        // Re-validate availability when the staff member, date, or location changes.
        if (data.staffId !== undefined || data.appointmentDate !== undefined || data.locationId !== undefined) {
          const existing = await getAppointmentById(id);
          const staffId = data.staffId ?? existing?.staffId ?? undefined;
          const appointmentDate = data.appointmentDate ?? existing?.appointmentDate;
          const locationId = data.locationId ?? existing?.locationId ?? null;
          const duration = existing?.duration ?? 30;
          if (staffId && appointmentDate) {
            const wallDate = scheduleDate ?? toIsoDate(appointmentDate);
            const wallTime = scheduleTime ?? dateToTime(appointmentDate);
            await assertStaffAvailable(staffId, wallDate, wallTime, duration, locationId);
            await assertNoOverlap(staffId, appointmentDate, duration, id);
          }
        }
        return await updateAppointment(id, data);
      }),

    deleteAppointment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAppointment(input.id);
      }),
  }),

  orders: router({
    createLabOrder: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          orderDate: z.date(),
          status: z.enum(["pending", "completed", "cancelled"]),
          provider: z.string().optional(),
          labVendor: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createLabOrder(input);
      }),
    getLabOrders: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientLabOrders(input.patientId, input.limit);
      }),
    deleteLabOrder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteLabOrder(input.id);
      }),
    createImagingOrder: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          orderDate: z.date(),
          status: z.enum(["pending", "completed", "cancelled"]),
          provider: z.string().optional(),
          imagingCenter: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createImagingOrder(input);
      }),
    getImagingOrders: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientImagingOrders(input.patientId, input.limit);
      }),
    deleteImagingOrder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteImagingOrder(input.id);
      }),
    createCardiacOrder: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          orderDate: z.date(),
          status: z.enum(["pending", "completed", "cancelled"]),
          provider: z.string().optional(),
          cardiacCenter: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCardiacOrder(input);
      }),
    getCardiacOrders: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientCardiacOrders(input.patientId, input.limit);
      }),
    deleteCardiacOrder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteCardiacOrder(input.id);
      }),
  }),

  documents: router({
    createDocument: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          documentType: z.string(),
          title: z.string(),
          content: z.string(),
          documentDate: z.date(),
          provider: z.string().optional(),
          status: z.enum(["draft", "final", "archived"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createClinicalDocument(input);
      }),
    getDocuments: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientDocuments(input.patientId, input.limit);
      }),
    deleteDocument: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteClinicalDocument(input.id);
      }),
    createInternalNote: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          content: z.string(),
          author: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createInternalNote(input);
      }),
    getInternalNotes: protectedProcedure
      .input(z.object({ reportId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientInternalNotes(input.reportId, input.limit);
      }),
    deleteInternalNote: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteInternalNote(input.id);
      }),
  }),

  referrals: router({
    createReferral: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          specialty: z.string(),
          referralDate: z.date(),
          status: z.enum(["pending", "accepted", "completed", "cancelled"]),
          referringProvider: z.string().optional(),
          referredTo: z.string(),
          reason: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createReferral(input);
      }),
    getReferrals: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientReferrals(input.patientId, input.limit);
      }),
    updateReferral: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "accepted", "completed", "cancelled"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateReferral(id, data);
      }),
    deleteReferral: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteReferral(input.id);
      }),
  }),

  prescriptions: router({
    createPrescription: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          medicationName: z.string(),
          dosage: z.string().optional(),
          prescriptionDate: z.date(),
          prescriber: z.string().optional(),
          status: z.enum(["active", "filled", "expired", "cancelled"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createPrescription(input);
      }),
    getPrescriptions: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientPrescriptions(input.patientId, input.limit);
      }),
    deletePrescription: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletePrescription(input.id);
      }),
  }),

  careGaps: router({
    getCareGapDefinitions: publicProcedure.query(async () => {
      return await getCareGapDefinitions();
    }),
    createPatientForm: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          formName: z.string(),
          formType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createPatientForm(input);
      }),
    getPatientForms: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientForms(input.patientId, input.limit);
      }),
    deletePatientForm: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletePatientForm(input.id);
      }),
    updatePatientForm: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          formName: z.string().optional(),
          formType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePatientForm(id, data);
      }),
  }),
  /**
   * STAFF & SCHEDULING
   */
  staff: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().default(false) }).optional())
      .query(async ({ input }) => {
        return await listStaff(input?.includeInactive ?? false);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const member = await getStaffById(input.id);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found" });
        return member;
      }),

    create: protectedProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          staffType: z.enum(["doctor", "nurse_practitioner", "dietitian"]),
          specialty: z.string().optional(),
          status: z.enum(["active", "inactive"]).default("active"),
        })
      )
      .mutation(async ({ input }) => {
        return await createStaff(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          firstName: z.string().min(1).optional(),
          lastName: z.string().min(1).optional(),
          staffType: z.enum(["doctor", "nurse_practitioner", "dietitian"]).optional(),
          specialty: z.string().optional(),
          status: z.enum(["active", "inactive"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateStaff(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteStaff(input.id);
      }),

    // WEEKLY SCHEDULES
    getWeeklySchedules: protectedProcedure
      .input(z.object({ staffId: z.number() }))
      .query(async ({ input }) => {
        return await getStaffWeeklySchedules(input.staffId);
      }),

    addWeeklySchedule: protectedProcedure
      .input(
        z.object({
          staffId: z.number(),
          locationId: z.number().optional(),
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
        })
      )
      .mutation(async ({ input }) => {
        if (input.endTime <= input.startTime) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "End time must be after start time" });
        }
        return await createWeeklySchedule(input);
      }),

    deleteWeeklySchedule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteWeeklySchedule(input.id);
      }),

    // SCHEDULE EXCEPTIONS
    getExceptions: protectedProcedure
      .input(
        z.object({
          staffId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getStaffScheduleExceptions(input.staffId, input.startDate, input.endDate);
      }),

    addException: protectedProcedure
      .input(
        z.object({
          staffId: z.number(),
          date: z.date(),
          type: z.enum(["time_off", "custom_hours"]).default("time_off"),
          locationId: z.number().optional(),
          startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.type === "custom_hours") {
          if (!input.startTime || !input.endTime) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Custom hours require a start and end time" });
          }
          if (input.endTime <= input.startTime) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "End time must be after start time" });
          }
        }
        return await createScheduleException(input);
      }),

    deleteException: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteScheduleException(input.id);
      }),

    // Resolved working blocks for a staff member on a specific date.
    getAvailability: protectedProcedure
      .input(z.object({ staffId: z.number(), date: z.date() }))
      .query(async ({ input }) => {
        return await getStaffAvailabilityForDate(input.staffId, input.date);
      }),
  }),

  locations: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().default(false) }).optional())
      .query(async ({ input }) => {
        return await listLocations(input?.includeInactive ?? false);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const loc = await getLocationById(input.id);
        if (!loc) throw new TRPCError({ code: "NOT_FOUND", message: "Location not found" });
        return loc;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          address: z.string().optional(),
          status: z.enum(["active", "inactive"]).default("active"),
        })
      )
      .mutation(async ({ input }) => {
        return await createLocation(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          address: z.string().optional(),
          status: z.enum(["active", "inactive"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateLocation(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteLocation(input.id);
      }),
  }),

  intake: router({
    // Helper: verify that an intake belongs to the given patientId.
    // Used internally by procedures that receive an intakeId directly.
    create: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          chiefComplaint: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const row = await createMedicalIntake(input.patientId, {
          chiefComplaint: input.chiefComplaint,
        });
        return { id: row.id };
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number(), patientId: z.number() }))
      .query(async ({ input }) => {
        const intake = await getMedicalIntake(input.id);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }
        return intake;
      }),
    getPatientIntakes: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        // Returns only intakes scoped to the requested patient
        return await getPatientIntakes(input.patientId);
      }),
    complete: protectedProcedure
      .input(z.object({ id: z.number(), patientId: z.number() }))
      .mutation(async ({ input }) => {
        // Verify ownership before completing
        const intake = await getMedicalIntake(input.id);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }

        // Mark completed first so it's persisted even if extraction fails
        await completeMedicalIntake(input.id);

        // Fetch the full conversation transcript for LLM extraction
        const chatMessages = await getIntakeChatMessages(input.id);
        if (chatMessages.length === 0) return { success: true };

        const transcript = chatMessages
          .map(m => `${m.role === "user" ? "Patient" : "Provider"}: ${m.content}`)
          .join("\n");

        try {
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a clinical medical scribe. Extract structured medical information from the patient intake conversation. Only include information explicitly stated by the patient. Use empty strings and empty arrays for fields not mentioned.",
              },
              {
                role: "user",
                content: `Extract medical data from this intake conversation:\n\n${transcript}`,
              },
            ],
            outputSchema: {
              name: "intake_extraction",
              schema: {
                type: "object",
                properties: {
                  chiefComplaint: { type: "string" },
                  presentingProblem: { type: "string" },
                  symptomOnset: { type: "string" },
                  symptomSeverity: { type: "string", enum: ["mild", "moderate", "severe", ""] },
                  associatedSymptoms: { type: "array", items: { type: "string" } },
                  medicalHistory: { type: "string" },
                  surgicalHistory: { type: "string" },
                  familyHistory: { type: "string" },
                  socialHistory: { type: "string" },
                  allergiesSummary: { type: "string" },
                  medicationsSummary: { type: "string" },
                  assessment: { type: "string" },
                  plan: { type: "string" },
                  problems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        icdCode: { type: "string" },
                      },
                      required: ["description"],
                    },
                  },
                  newAllergies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        allergen: { type: "string" },
                        severity: { type: "string", enum: ["mild", "moderate", "severe", ""] },
                        reaction: { type: "string" },
                      },
                      required: ["allergen"],
                    },
                  },
                  newMedications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        dosage: { type: "string" },
                        frequency: { type: "string" },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: ["chiefComplaint", "problems", "newAllergies", "newMedications"],
                additionalProperties: false,
              },
            },
          });

          const raw = llmResult.choices[0]?.message?.content;
          if (!raw || typeof raw !== "string") return { success: true };

          const extracted = JSON.parse(raw);

          // Persist structured fields back onto the intake record
          await updateMedicalIntake(input.id, {
            chiefComplaint: extracted.chiefComplaint || undefined,
            presentingProblem: extracted.presentingProblem || undefined,
            symptomOnset: extracted.symptomOnset || undefined,
            symptomSeverity: (extracted.symptomSeverity as "mild" | "moderate" | "severe") || undefined,
            associatedSymptoms: extracted.associatedSymptoms?.length ? extracted.associatedSymptoms : undefined,
            medicalHistory: extracted.medicalHistory || undefined,
            surgicalHistory: extracted.surgicalHistory || undefined,
            familyHistory: extracted.familyHistory || undefined,
            socialHistory: extracted.socialHistory || undefined,
            allergies: extracted.allergiesSummary || undefined,
            currentMedications: extracted.newMedications?.length ? extracted.newMedications : undefined,
          });

          // Create a draft visit note from the intake data
          await createVisitNote({
            patientId: input.patientId,
            visitDate: new Date(),
            visitType: "Medical Intake",
            chief_complaint: extracted.chiefComplaint || undefined,
            history_of_present_illness: extracted.presentingProblem || undefined,
            past_medical_history: extracted.medicalHistory || undefined,
            past_surgical_history: extracted.surgicalHistory || undefined,
            medications_review: extracted.medicationsSummary || undefined,
            allergies_review: extracted.allergiesSummary || undefined,
            assessment: extracted.assessment || undefined,
            plan: extracted.plan || undefined,
            status: "draft",
          });

          // Add identified problems to the clinical chart (skip duplicates)
          const existingProblems = await getPatientActiveProblems(input.patientId);
          const existingProblemNames = new Set(existingProblems.map(p => p.description.toLowerCase()));
          for (const problem of extracted.problems ?? []) {
            if (!problem.description) continue;
            if (existingProblemNames.has(problem.description.toLowerCase())) continue;
            const icdCode = await lookupIcdCode(problem.description);
            await createProblem({
              patientId: input.patientId,
              description: problem.description,
              icdCode,
              status: "active",
            });
          }

          // Add reported allergies to the clinical chart (skip duplicates)
          const existingAllergies = await getPatientAllergiesFromClinical(input.patientId);
          const existingAllergenNames = new Set(existingAllergies.map(a => a.allergen.toLowerCase()));
          for (const allergy of extracted.newAllergies ?? []) {
            if (!allergy.allergen) continue;
            if (existingAllergenNames.has(allergy.allergen.toLowerCase())) continue;
            await createAllergy({
              patientId: input.patientId,
              allergen: allergy.allergen,
              severity: (allergy.severity as "mild" | "moderate" | "severe") || undefined,
              reaction: allergy.reaction || undefined,
            });
          }

          // Add reported medications to the clinical chart (skip duplicates)
          const existingMeds = await getPatientActiveMedications(input.patientId);
          const existingMedNames = new Set(existingMeds.map(m => m.medicationName.toLowerCase()));
          for (const med of extracted.newMedications ?? []) {
            if (!med.name) continue;
            if (existingMedNames.has(med.name.toLowerCase())) continue;
            await createMedication({
              patientId: input.patientId,
              medicationName: med.name,
              dosage: med.dosage || undefined,
              frequency: med.frequency || undefined,
              status: "active",
            });
          }
        } catch (err) {
          console.error("[intake.complete] LLM extraction/chart write failed:", err);
        }

        return { success: true };
      }),
    addMessage: protectedProcedure
      .input(
        z.object({
          medicalIntakeId: z.number(),
          patientId: z.number(),
          role: z.enum(["user", "assistant"]),
          content: z.string(),
          messageType: z.enum(["question", "response", "symptom_collected", "history_collected"]).optional(),
          extractedData: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Verify ownership before adding message
        const intake = await getMedicalIntake(input.medicalIntakeId);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }
        return await addIntakeChatMessage(input.medicalIntakeId, {
          role: input.role,
          content: input.content,
          messageType: input.messageType,
          extractedData: input.extractedData,
        });
      }),
    getMessages: protectedProcedure
      .input(z.object({ medicalIntakeId: z.number(), patientId: z.number() }))
      .query(async ({ input }) => {
        // Verify ownership before returning messages
        const intake = await getMedicalIntake(input.medicalIntakeId);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }
        return await getIntakeChatMessages(input.medicalIntakeId);
      }),
    addSymptom: protectedProcedure
      .input(
        z.object({
          medicalIntakeId: z.number(),
          patientId: z.number(),
          symptom: z.string(),
          severity: z.enum(["mild", "moderate", "severe"]).optional(),
          duration: z.string().optional(),
          onset: z.string().optional(),
          associatedFactors: z.string().optional(),
          relievingFactors: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Verify ownership before adding symptom
        const intake = await getMedicalIntake(input.medicalIntakeId);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }
        return await addIntakeSymptom(input.medicalIntakeId, {
          symptom: input.symptom,
          severity: input.severity,
          duration: input.duration,
          onset: input.onset,
          associatedFactors: input.associatedFactors,
          relievingFactors: input.relievingFactors,
        });
      }),
    getSymptoms: protectedProcedure
      .input(z.object({ medicalIntakeId: z.number(), patientId: z.number() }))
      .query(async ({ input }) => {
        // Verify ownership before returning symptoms
        const intake = await getMedicalIntake(input.medicalIntakeId);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }
        return await getIntakeSymptoms(input.medicalIntakeId);
      }),
    deleteSymptom: protectedProcedure
      .input(z.object({ id: z.number(), patientId: z.number() }))
      .mutation(async ({ input }) => {
        // Verify the symptom belongs to an intake owned by the given patient
        const symptom = await getIntakeSymptomById(input.id);
        if (!symptom) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Symptom not found" });
        }
        const intake = await getMedicalIntake(symptom.medicalIntakeId);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: symptom does not belong to this patient" });
        }
        return await deleteIntakeSymptom(input.id);
      }),
    chat: protectedProcedure
      .input(
        z.object({
          medicalIntakeId: z.number(),
          patientId: z.number(),
          message: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Verify ownership: ensure this intake belongs to the stated patient
        // before loading its messages or sending them to the LLM.
        const intake = await getMedicalIntake(input.medicalIntakeId);
        if (!intake || intake.patientId !== input.patientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied: intake does not belong to this patient" });
        }

        const existingMessages = await getIntakeChatMessages(input.medicalIntakeId);

        const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = existingMessages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        conversationHistory.push({
          role: "user",
          content: input.message,
        });

        await addIntakeChatMessage(input.medicalIntakeId, {
          role: "user",
          content: input.message,
          messageType: "question",
        });

        const COMPLETE_SENTINEL = "[INTAKE_COMPLETE]";

        const existingProblemsForPrompt = await getPatientActiveProblems(input.patientId);
        const existingProblemsSection = existingProblemsForPrompt.length > 0
          ? `\nExisting problems on this patient's chart:\n${existingProblemsForPrompt.map(p => `- ${p.description}${p.icdCode ? ` (${p.icdCode})` : ""}`).join("\n")}\n\nAt the very start of the intake, before asking anything else, ask the patient whether today's visit is related to one of these existing problems or is a brand new complaint. Use their answer to guide the rest of the interview.`
          : "";

        const systemPrompt = `You are a medical intake assistant helping to collect patient health information.
You are conducting a structured medical interview to gather:
- Chief complaint and presenting problem
- Symptom details (onset, severity, duration, associated factors)
- Medical history
- Surgical history
- Family history
- Social history
- Current medications
- Allergies
${existingProblemsSection}
Current intake information:
- Chief Complaint: ${intake?.chiefComplaint || "Not yet provided"}
- Status: ${intake?.status}

Ask clarifying questions to gather complete information. Be empathetic and professional.
When you collect specific information, explicitly state what you've learned.
Keep responses concise and focused on one topic at a time.
When you have gathered sufficient information across all areas above, end your final message with the exact token: ${COMPLETE_SENTINEL}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const rawMessage = typeof messageContent === 'string' ? messageContent : "I apologize, I couldn't process that. Could you please repeat?";

        const intakeComplete = rawMessage.includes(COMPLETE_SENTINEL);
        const assistantMessage = rawMessage.replace(COMPLETE_SENTINEL, "").trim();

        await addIntakeChatMessage(input.medicalIntakeId, {
          role: "assistant",
          content: assistantMessage,
          messageType: "response",
        });

        if (intakeComplete) {
          await completeMedicalIntake(input.medicalIntakeId);
          const chatMessages = await getIntakeChatMessages(input.medicalIntakeId);
          const transcript = chatMessages
            .map(m => `${m.role === "user" ? "Patient" : "Provider"}: ${m.content}`)
            .join("\n");
          try {
            const llmResult = await invokeLLM({
              messages: [
                { role: "system", content: "You are a clinical medical scribe. Extract structured medical information from the patient intake conversation. Only include information explicitly stated by the patient. Use empty strings and empty arrays for fields not mentioned." },
                { role: "user", content: `Extract medical data from this intake conversation:\n\n${transcript}` },
              ],
              outputSchema: {
                name: "intake_extraction",
                schema: {
                  type: "object",
                  properties: {
                    chiefComplaint: { type: "string" },
                    presentingProblem: { type: "string" },
                    symptomOnset: { type: "string" },
                    symptomSeverity: { type: "string", enum: ["mild", "moderate", "severe", ""] },
                    associatedSymptoms: { type: "array", items: { type: "string" } },
                    medicalHistory: { type: "string" },
                    surgicalHistory: { type: "string" },
                    familyHistory: { type: "string" },
                    socialHistory: { type: "string" },
                    allergiesSummary: { type: "string" },
                    medicationsSummary: { type: "string" },
                    assessment: { type: "string" },
                    plan: { type: "string" },
                    problems: { type: "array", items: { type: "object", properties: { description: { type: "string" }, icdCode: { type: "string" } }, required: ["description"] } },
                    newAllergies: { type: "array", items: { type: "object", properties: { allergen: { type: "string" }, severity: { type: "string", enum: ["mild", "moderate", "severe", ""] }, reaction: { type: "string" } }, required: ["allergen"] } },
                    newMedications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, dosage: { type: "string" }, frequency: { type: "string" } }, required: ["name"] } },
                  },
                  required: ["chiefComplaint", "problems", "newAllergies", "newMedications"],
                  additionalProperties: false,
                },
              },
            });
            const raw = llmResult.choices[0]?.message?.content;
            if (raw && typeof raw === "string") {
              const extracted = JSON.parse(raw);
              await updateMedicalIntake(input.medicalIntakeId, {
                chiefComplaint: extracted.chiefComplaint || undefined,
                presentingProblem: extracted.presentingProblem || undefined,
                symptomOnset: extracted.symptomOnset || undefined,
                symptomSeverity: (extracted.symptomSeverity as "mild" | "moderate" | "severe") || undefined,
                associatedSymptoms: extracted.associatedSymptoms?.length ? extracted.associatedSymptoms : undefined,
                medicalHistory: extracted.medicalHistory || undefined,
                surgicalHistory: extracted.surgicalHistory || undefined,
                familyHistory: extracted.familyHistory || undefined,
                socialHistory: extracted.socialHistory || undefined,
                allergies: extracted.allergiesSummary || undefined,
                currentMedications: extracted.newMedications?.length ? extracted.newMedications : undefined,
              });
              await createVisitNote({
                patientId: input.patientId,
                visitDate: new Date(),
                visitType: "Medical Intake",
                chief_complaint: extracted.chiefComplaint || undefined,
                history_of_present_illness: extracted.presentingProblem || undefined,
                past_medical_history: extracted.medicalHistory || undefined,
                past_surgical_history: extracted.surgicalHistory || undefined,
                medications_review: extracted.medicationsSummary || undefined,
                allergies_review: extracted.allergiesSummary || undefined,
                assessment: extracted.assessment || undefined,
                plan: extracted.plan || undefined,
                status: "draft",
              });
              const existingProblems = await getPatientActiveProblems(input.patientId);
              const existingProblemNames = new Set(existingProblems.map(p => p.description.toLowerCase()));
              for (const problem of extracted.problems ?? []) {
                if (!problem.description || existingProblemNames.has(problem.description.toLowerCase())) continue;
                const icdCode = await lookupIcdCode(problem.description);
                await createProblem({ patientId: input.patientId, description: problem.description, icdCode, status: "active" });
              }
              const existingAllergies = await getPatientAllergiesFromClinical(input.patientId);
              const existingAllergenNames = new Set(existingAllergies.map(a => a.allergen.toLowerCase()));
              for (const allergy of extracted.newAllergies ?? []) {
                if (!allergy.allergen || existingAllergenNames.has(allergy.allergen.toLowerCase())) continue;
                await createAllergy({ patientId: input.patientId, allergen: allergy.allergen, severity: (allergy.severity as "mild" | "moderate" | "severe") || undefined, reaction: allergy.reaction || undefined });
              }
              const existingMeds = await getPatientActiveMedications(input.patientId);
              const existingMedNames = new Set(existingMeds.map(m => m.medicationName.toLowerCase()));
              for (const med of extracted.newMedications ?? []) {
                if (!med.name || existingMedNames.has(med.name.toLowerCase())) continue;
                await createMedication({ patientId: input.patientId, medicationName: med.name, dosage: med.dosage || undefined, frequency: med.frequency || undefined, status: "active" });
              }
            }
          } catch (err) {
            console.error("[intake.chat] auto-completion extraction failed:", err);
          }
        }

        return {
          message: assistantMessage,
          intakeId: input.medicalIntakeId,
          intakeComplete,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
