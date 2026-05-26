# Cloud EMR - API Documentation

## Overview

Cloud EMR is a comprehensive electronic health record system built with tRPC, providing a type-safe API for managing patient data, clinical information, and healthcare workflows.

## Authentication

All API endpoints require authentication via Manus OAuth. The authentication flow is handled automatically:

- Users log in via the Manus OAuth portal
- Session cookies are created and maintained
- All tRPC procedures validate user context via `protectedProcedure`

## Base URL

```
https://your-domain.manus.space/api/trpc
```

## Patient Management API

### List Patients

Retrieve a paginated list of all patients.

**Endpoint:** `patients.list`

**Input:**
```typescript
{
  limit: number;      // Default: 50
  offset: number;     // Default: 0
}
```

**Response:**
```typescript
Patient[]
```

**Example:**
```typescript
const patients = await trpc.patients.list.useQuery({
  limit: 10,
  offset: 0,
});
```

---

### Search Patients

Search for patients by name or MRN.

**Endpoint:** `patients.search`

**Input:**
```typescript
{
  query: string;      // Search term (name, MRN, email)
  limit?: number;     // Default: 50
  offset?: number;    // Default: 0
}
```

**Response:**
```typescript
Patient[]
```

**Example:**
```typescript
const results = await trpc.patients.search.useMutation();
results.mutate({
  query: "John Doe",
  limit: 20,
});
```

---

### Get Patient by ID

Retrieve detailed information for a specific patient.

**Endpoint:** `patients.getById`

**Input:**
```typescript
{
  id: number;  // Patient ID
}
```

**Response:**
```typescript
{
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: "M" | "F" | "Other" | "Unknown";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  mrn?: string;
  ssn?: string;
  status: "active" | "inactive" | "deceased";
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Create Patient

Create a new patient record.

**Endpoint:** `patients.create`

**Input:**
```typescript
{
  firstName: string;                              // Required
  lastName: string;                               // Required
  dateOfBirth?: Date;
  gender?: "M" | "F" | "Other" | "Unknown";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ssn?: string;
  mrn?: string;                                   // Must be unique
}
```

**Response:**
```typescript
Patient  // Full patient object with generated ID
```

**Error Handling:**
- Returns error if MRN already exists
- Email must be valid format if provided

---

### Update Patient

Update patient information.

**Endpoint:** `patients.update`

**Input:**
```typescript
{
  id: number;                                     // Required
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "M" | "F" | "Other" | "Unknown";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profilePhotoUrl?: string;
}
```

**Response:**
```typescript
Patient  // Updated patient object
```

---

### Delete Patient

Delete a patient record (soft delete).

**Endpoint:** `patients.delete`

**Input:**
```typescript
{
  id: number;  // Patient ID
}
```

**Response:**
```typescript
{ success: boolean }
```

---

### Get Patient Insurance

Retrieve insurance information for a patient.

**Endpoint:** `patients.getInsurance`

**Input:**
```typescript
{
  patientId: number;
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  insuranceProvider: string;
  memberId: string;
  groupNumber?: string;
  planName?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  isPrimary: boolean;
}[]
```

---

### Add Insurance

Add insurance coverage for a patient.

**Endpoint:** `patients.addInsurance`

**Input:**
```typescript
{
  patientId: number;
  insuranceProvider: string;
  memberId: string;
  groupNumber?: string;
  planName?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  isPrimary?: boolean;  // Default: true
}
```

**Response:**
```typescript
Insurance  // Full insurance object with ID
```

---

### Get Provider Team

Retrieve assigned providers for a patient.

**Endpoint:** `patients.getProviderTeam`

**Input:**
```typescript
{
  patientId: number;
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  providerId?: number;
  providerName: string;
  specialty?: string;
  role?: string;
}[]
```

---

### Add Provider

Assign a provider to a patient's care team.

**Endpoint:** `patients.addProvider`

**Input:**
```typescript
{
  patientId: number;
  providerId?: number;
  providerName: string;
  specialty?: string;
  role?: string;
}
```

**Response:**
```typescript
ProviderTeam  // Full provider team object with ID
```

---

## Clinical Chart API

### Problems Management

#### Get Problems

Retrieve active and historical problems for a patient.

**Endpoint:** `clinical.getProblems`

**Input:**
```typescript
{
  patientId: number;
  status?: "active" | "inactive" | "resolved";
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  description: string;
  icdCode?: string;
  status: "active" | "inactive" | "resolved";
  onsetDate?: Date;
  resolutionDate?: Date;
}[]
```

---

#### Create Problem

Add a new problem to patient's chart.

**Endpoint:** `clinical.createProblem`

**Input:**
```typescript
{
  patientId: number;
  description: string;
  icdCode?: string;
  status?: "active" | "inactive" | "resolved";
  onsetDate?: Date;
}
```

**Response:**
```typescript
Problem  // Full problem object with ID
```

---

#### Delete Problem

Remove a problem from patient's chart.

**Endpoint:** `clinical.deleteProblem`

**Input:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
{ success: boolean }
```

---

### Allergies Management

#### Get Allergies

Retrieve all allergies for a patient.

**Endpoint:** `clinical.getAllergies`

**Input:**
```typescript
{
  patientId: number;
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  allergen: string;
  severity: "mild" | "moderate" | "severe";
  reaction?: string;
  status: "active" | "inactive" | "resolved";
}[]
```

---

#### Create Allergy

Add a new allergy to patient's chart.

**Endpoint:** `clinical.createAllergy`

**Input:**
```typescript
{
  patientId: number;
  allergen: string;
  severity: "mild" | "moderate" | "severe";
  reaction?: string;
  status?: "active" | "inactive" | "resolved";
}
```

**Response:**
```typescript
Allergy  // Full allergy object with ID
```

---

#### Delete Allergy

Remove an allergy from patient's chart.

**Endpoint:** `clinical.deleteAllergy`

**Input:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
{ success: boolean }
```

---

### Medications Management

#### Get Medications

Retrieve current and historical medications for a patient.

**Endpoint:** `clinical.getMedications`

**Input:**
```typescript
{
  patientId: number;
  status?: "active" | "discontinued" | "completed";
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  status: "active" | "discontinued" | "completed";
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}[]
```

---

#### Create Medication

Add a new medication to patient's chart.

**Endpoint:** `clinical.createMedication`

**Input:**
```typescript
{
  patientId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  status?: "active" | "discontinued" | "completed";
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}
```

**Response:**
```typescript
Medication  // Full medication object with ID
```

---

#### Delete Medication

Remove a medication from patient's chart.

**Endpoint:** `clinical.deleteMedication`

**Input:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
{ success: boolean }
```

---

### Immunizations Management

#### Get Immunizations

Retrieve immunization history for a patient.

**Endpoint:** `clinical.getImmunizations`

**Input:**
```typescript
{
  patientId: number;
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  vaccineName: string;
  administrationDate: Date;
  lot?: string;
  expirationDate?: Date;
  manufacturer?: string;
  seriesDose?: number;
  seriesTotal?: number;
}[]
```

---

#### Create Immunization

Record a new immunization for a patient.

**Endpoint:** `clinical.createImmunization`

**Input:**
```typescript
{
  patientId: number;
  vaccineName: string;
  administrationDate: Date;
  lot?: string;
  expirationDate?: Date;
  manufacturer?: string;
  seriesDose?: number;
  seriesTotal?: number;
}
```

**Response:**
```typescript
Immunization  // Full immunization object with ID
```

---

#### Delete Immunization

Remove an immunization record.

**Endpoint:** `clinical.deleteImmunization`

**Input:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
{ success: boolean }
```

---

## Vitals API

### Get Vitals

Retrieve vital signs history for a patient.

**Endpoint:** `vitals.getVitals`

**Input:**
```typescript
{
  patientId: number;
  limit?: number;      // Default: 50
  offset?: number;     // Default: 0
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  recordDate: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}[]
```

---

### Create Vital

Record new vital signs for a patient.

**Endpoint:** `vitals.createVital`

**Input:**
```typescript
{
  patientId: number;
  recordDate: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}
```

**Response:**
```typescript
Vital  // Full vital record with calculated BMI
```

---

### Get Latest Vital

Retrieve the most recent vital signs for a patient.

**Endpoint:** `vitals.getLatestVital`

**Input:**
```typescript
{
  patientId: number;
}
```

**Response:**
```typescript
Vital | null  // Latest vital record or null if none exist
```

---

## Visit Notes API

### Get Visit Notes

Retrieve visit notes for a patient.

**Endpoint:** `visits.getVisitNotes`

**Input:**
```typescript
{
  patientId: number;
  limit?: number;      // Default: 50
  offset?: number;     // Default: 0
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  visitDate: Date;
  visitType?: string;
  provider?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  status: "draft" | "completed" | "signed";
  signedBy?: string;
  signedDate?: Date;
}[]
```

---

### Create Visit Note

Create a new SOAP-style visit note.

**Endpoint:** `visits.createVisitNote`

**Input:**
```typescript
{
  patientId: number;
  visitDate: Date;
  visitType?: string;
  provider?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  status?: "draft" | "completed" | "signed";
}
```

**Response:**
```typescript
VisitNote  // Full visit note object with ID
```

---

### Update Visit Note

Update an existing visit note.

**Endpoint:** `visits.updateVisitNote`

**Input:**
```typescript
{
  id: number;
  visitDate?: Date;
  visitType?: string;
  provider?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  status?: "draft" | "completed" | "signed";
  signedBy?: string;
  signedDate?: Date;
}
```

**Response:**
```typescript
VisitNote  // Updated visit note object
```

---

### Delete Visit Note

Remove a visit note.

**Endpoint:** `visits.deleteVisitNote`

**Input:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
{ success: boolean }
```

---

## Appointments API

### Get Appointments

Retrieve appointments for a patient.

**Endpoint:** `appointments.getAppointments`

**Input:**
```typescript
{
  patientId: number;
  limit?: number;      // Default: 50
  offset?: number;     // Default: 0
}
```

**Response:**
```typescript
{
  id: number;
  patientId: number;
  appointmentDate: Date;
  provider?: string;
  appointmentType?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
}[]
```

---

### Create Appointment

Schedule a new appointment.

**Endpoint:** `appointments.createAppointment`

**Input:**
```typescript
{
  patientId: number;
  appointmentDate: Date;
  provider?: string;
  appointmentType?: string;
  status?: "scheduled" | "confirmed";
  notes?: string;
}
```

**Response:**
```typescript
Appointment  // Full appointment object with ID
```

---

### Update Appointment

Update an existing appointment.

**Endpoint:** `appointments.updateAppointment`

**Input:**
```typescript
{
  id: number;
  appointmentDate?: Date;
  provider?: string;
  appointmentType?: string;
  status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  notes?: string;
}
```

**Response:**
```typescript
Appointment  // Updated appointment object
```

---

### Delete Appointment

Cancel/remove an appointment.

**Endpoint:** `appointments.deleteAppointment`

**Input:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
{ success: boolean }
```

---

## Error Handling

All API endpoints follow standard error handling patterns:

**Error Response:**
```typescript
{
  code: string;        // Error code (e.g., "NOT_FOUND", "FORBIDDEN")
  message: string;     // Human-readable error message
}
```

**Common Error Codes:**
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - User lacks permission
- `BAD_REQUEST` - Invalid input
- `CONFLICT` - Resource conflict (e.g., duplicate MRN)
- `INTERNAL_SERVER_ERROR` - Server error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Limit:** 1000 requests per hour per user
- **Response Header:** `X-RateLimit-Remaining`

---

## Pagination

List endpoints support pagination:

```typescript
{
  limit: number;   // Items per page (default: 50, max: 100)
  offset: number;  // Number of items to skip (default: 0)
}
```

---

## Data Types

### Patient Status
- `active` - Patient is currently active
- `inactive` - Patient is inactive
- `deceased` - Patient is deceased

### Problem Status
- `active` - Currently active problem
- `inactive` - Inactive problem
- `resolved` - Problem has been resolved

### Allergy Severity
- `mild` - Mild allergic reaction
- `moderate` - Moderate allergic reaction
- `severe` - Severe allergic reaction (anaphylaxis risk)

### Medication Status
- `active` - Currently taking medication
- `discontinued` - Medication has been stopped
- `completed` - Medication course completed

### Visit Note Status
- `draft` - Note is in draft/incomplete state
- `completed` - Note is completed
- `signed` - Note has been signed by provider

### Appointment Status
- `scheduled` - Appointment is scheduled
- `confirmed` - Appointment has been confirmed
- `completed` - Appointment has been completed
- `cancelled` - Appointment has been cancelled
- `no-show` - Patient did not show up

---

## Best Practices

1. **Always check authentication** - Ensure user is logged in before making API calls
2. **Handle errors gracefully** - Implement proper error handling and user feedback
3. **Use pagination** - For large result sets, use limit/offset parameters
4. **Cache data** - Use React Query caching to minimize API calls
5. **Validate input** - Validate user input before sending to API
6. **Use optimistic updates** - Update UI immediately, then sync with server
7. **Handle timestamps** - All dates are stored as UTC timestamps

---

## Examples

### Create a Patient and Add Insurance

```typescript
// Create patient
const newPatient = await trpc.patients.create.useMutation();
const patient = await newPatient.mutateAsync({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  mrn: "MRN123456",
});

// Add insurance
const addInsurance = await trpc.patients.addInsurance.useMutation();
await addInsurance.mutateAsync({
  patientId: patient.id,
  insuranceProvider: "Blue Cross",
  memberId: "BC123456",
  isPrimary: true,
});
```

### Record Vitals and Create Visit Note

```typescript
// Record vitals
const createVital = trpc.vitals.createVital.useMutation();
await createVital.mutateAsync({
  patientId: patientId,
  recordDate: new Date(),
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 72,
  temperature: 98.6,
  weight: 180,
  height: 70,
});

// Create visit note
const createNote = trpc.visits.createVisitNote.useMutation();
await createNote.mutateAsync({
  patientId: patientId,
  visitDate: new Date(),
  provider: "Dr. Smith",
  subjective: "Patient reports fever and cough",
  objective: "Temp 101.2F, lungs clear",
  assessment: "Acute bronchitis",
  plan: "Prescribe antibiotics, rest",
  status: "completed",
});
```

### Schedule Appointment

```typescript
const createAppt = trpc.appointments.createAppointment.useMutation();
await createAppt.mutateAsync({
  patientId: patientId,
  appointmentDate: new Date("2024-02-20T10:00:00"),
  provider: "Dr. Johnson",
  appointmentType: "Follow-up",
  status: "scheduled",
});
```

---

## Support

For API issues or questions, please contact the development team or refer to the inline code documentation.
