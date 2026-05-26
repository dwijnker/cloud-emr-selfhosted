import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
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
} from "./appointments";

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
          provider: z.string().optional(),
          location: z.string().optional(),
          duration: z.number().optional(),
          status: z.enum(["scheduled", "completed", "cancelled", "no-show"]).default("scheduled"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createAppointment(input);
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

    updateAppointment: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          appointmentDate: z.date().optional(),
          appointmentType: z.string().optional(),
          provider: z.string().optional(),
          location: z.string().optional(),
          status: z.enum(["scheduled", "completed", "cancelled", "no-show"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateAppointment(id, data);
      }),

    deleteAppointment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAppointment(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
