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
    // List all active patients
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

    // Search patients
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

    // Get patient by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const patient = await getPatientById(input.id);
        if (!patient) {
          throw new Error("Patient not found");
        }
        return patient;
      }),

    // Create new patient
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
        // Check if MRN already exists
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

    // Update patient
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

    // Delete patient (soft delete)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletePatient(input.id);
      }),

    // Get patient insurance
    getInsurance: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientInsurance(input.patientId);
      }),

    // Add insurance
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

    // Get provider team
    getProviderTeam: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientProviderTeam(input.patientId);
      }),

    // Add provider to team
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
    // Get patient problems
    getProblems: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientProblems(input.patientId);
      }),

    // Get patient allergies
    getAllergies: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientAllergies(input.patientId);
      }),

    // Get patient medications
    getMedications: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getPatientMedications(input.patientId);
      }),
  }),

  /**
   * VITALS
   */
  vitals: router({
    // Get patient vitals
    getVitals: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientVitals(input.patientId, input.limit);
      }),
  }),

  /**
   * VISIT NOTES
   */
  visits: router({
    // Get patient visit notes
    getVisitNotes: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientVisitNotes(input.patientId, input.limit);
      }),
  }),

  /**
   * APPOINTMENTS
   */
  appointments: router({
    // Get patient appointments
    getAppointments: protectedProcedure
      .input(z.object({ patientId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getPatientAppointments(input.patientId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
