# Cloud EMR - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Patient Management](#patient-management)
3. [Clinical Chart](#clinical-chart)
4. [Visit Notes](#visit-notes)
5. [Vitals Tracking](#vitals-tracking)
6. [Appointments](#appointments)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Navigate to the Cloud EMR application
2. Click "Login" or "Get Started"
3. You will be redirected to the Manus OAuth portal
4. Enter your credentials
5. Authorize the application
6. You will be redirected back to the EMR dashboard

### Dashboard Overview

The main dashboard provides quick access to:
- **Patient Search** - Find patients by name or MRN
- **Recent Patients** - Quick access to frequently viewed patients
- **Quick Actions** - Create new patient, schedule appointment
- **Navigation Menu** - Access all EMR features

---

## Patient Management

### Creating a New Patient

1. Click **"New Patient"** or navigate to **Patients → Create**
2. Fill in required fields:
   - **First Name** (required)
   - **Last Name** (required)
   - **MRN** (optional but recommended for uniqueness)
3. Fill in optional demographic information:
   - Date of Birth
   - Gender
   - Email
   - Phone
   - Address
   - City, State, ZIP
4. Click **"Create Patient"**

**Note:** MRN must be unique across the system. If you enter a duplicate MRN, you will receive an error.

### Viewing Patient Details

1. Navigate to **Patients** or use the search bar
2. Click on a patient's name to view their profile
3. The patient detail page shows:
   - **Demographics** - Basic patient information
   - **Insurance** - Insurance coverage details
   - **Providers** - Assigned care team members
   - **Clinical Summary** - Quick overview of problems, medications, allergies
   - **Recent Activity** - Latest visits and appointments

### Editing Patient Information

1. Open a patient's detail page
2. Click the **"Edit"** button
3. Update any fields (all fields are optional except name)
4. Click **"Save Changes"**

### Managing Insurance

1. Open a patient's detail page
2. Go to the **"Insurance"** tab
3. Click **"Add Insurance"** to add new coverage
4. Fill in insurance details:
   - Insurance Provider
   - Member ID (required)
   - Group Number (optional)
   - Plan Name (optional)
   - Mark as Primary Insurance
5. Click **"Add Insurance"**

**Multiple Insurance:** Patients can have multiple insurance policies. Mark one as "Primary" for billing purposes.

### Managing Provider Team

1. Open a patient's detail page
2. Go to the **"Providers"** tab
3. Click **"Add Provider"** to assign a new provider
4. Enter provider information:
   - Provider Name (required)
   - Specialty (optional)
   - Role (e.g., Primary Care Physician, Specialist)
5. Click **"Add Provider"**

---

## Clinical Chart

The Clinical Chart maintains comprehensive medical records for each patient, including problems, allergies, medications, and immunizations.

### Problems List

#### Adding a Problem

1. Open patient's detail page
2. Go to **Clinical Chart** section
3. Click on the **"Problems"** tab
4. Click **"Add Problem"**
5. Enter problem details:
   - **Description** (required) - e.g., "Hypertension"
   - **ICD Code** (optional) - e.g., "I10"
   - **Status** - Active, Inactive, or Resolved
   - **Onset Date** (optional)
6. Click **"Add Problem"**

#### Viewing Problems

- Active problems are displayed prominently
- Click on any problem to view details
- Problems are color-coded by status

#### Deleting a Problem

1. Locate the problem in the list
2. Click the **"Delete"** icon
3. Confirm deletion

### Allergies

#### Adding an Allergy

1. Go to **Clinical Chart → Allergies** tab
2. Click **"Add Allergy"**
3. Enter allergy information:
   - **Allergen** (required) - e.g., "Penicillin"
   - **Severity** - Mild, Moderate, or Severe
   - **Reaction** (optional) - e.g., "Rash", "Anaphylaxis"
   - **Status** - Active, Inactive, or Resolved
4. Click **"Add Allergy"**

**Important:** Severe allergies are highlighted in red for quick identification.

#### Managing Allergies

- Severe allergies appear at the top of the list
- Allergies are displayed with color-coded severity badges
- Delete allergies by clicking the delete icon

### Medications

#### Adding a Medication

1. Go to **Clinical Chart → Medications** tab
2. Click **"Add Medication"**
3. Enter medication details:
   - **Medication Name** (required)
   - **Dosage** (required) - e.g., "10 mg"
   - **Frequency** (required) - e.g., "Twice daily"
   - **Route** (required) - Oral, IV, IM, etc.
   - **Status** - Active, Discontinued, or Completed
   - **Start Date** (optional)
   - **End Date** (optional)
   - **Notes** (optional)
4. Click **"Add Medication"**

#### Medication Status

- **Active** - Patient is currently taking this medication
- **Discontinued** - Medication has been stopped
- **Completed** - Medication course is finished

### Immunizations

#### Recording an Immunization

1. Go to **Clinical Chart → Immunizations** tab
2. Click **"Add Immunization"**
3. Enter vaccine information:
   - **Vaccine Name** (required) - e.g., "COVID-19"
   - **Administration Date** (required)
   - **Lot Number** (optional)
   - **Expiration Date** (optional)
   - **Manufacturer** (optional)
   - **Series Information** (optional) - e.g., "Dose 2 of 3"
4. Click **"Add Immunization"**

#### Viewing Immunization History

- All immunizations are displayed chronologically
- Series information helps track multi-dose vaccines
- Lot numbers are tracked for safety monitoring

---

## Visit Notes

Visit notes use the SOAP format (Subjective, Objective, Assessment, Plan) for structured clinical documentation.

### Creating a Visit Note

1. Navigate to **Visit Notes** for a patient
2. Click **"New Visit Note"**
3. Fill in visit information:
   - **Visit Date** (required)
   - **Visit Type** (optional) - e.g., "Office Visit", "Telehealth"
   - **Provider** (optional) - Name of treating provider
4. Enter SOAP components:
   - **Subjective** - Patient's chief complaint and history
   - **Objective** - Physical exam findings and test results
   - **Assessment** - Clinical diagnosis and impression
   - **Plan** - Treatment plan and follow-up
5. Set status:
   - **Draft** - Note is incomplete
   - **Completed** - Note is finished but not signed
   - **Signed** - Note has been reviewed and signed
6. Click **"Save"**

### Editing Visit Notes

1. Open the visit note
2. Click **"Edit"**
3. Make changes to any section
4. Update status if needed
5. Click **"Save Changes"**

### Signing Visit Notes

1. Open a completed visit note
2. Click **"Sign Note"**
3. Confirm your identity
4. Note status changes to "Signed"

**Note:** Signed notes cannot be edited. Create a new addendum if changes are needed.

### Viewing Visit History

1. Go to patient's detail page
2. Select **"Activity"** tab
3. Recent visits are displayed chronologically
4. Click on any visit to view full details

---

## Vitals Tracking

### Recording Vital Signs

1. Navigate to **Vitals** for a patient
2. Click **"Record Vitals"**
3. Enter vital measurements:
   - **Blood Pressure** - Systolic/Diastolic (e.g., 120/80)
   - **Heart Rate** - Beats per minute
   - **Temperature** - In Fahrenheit
   - **Weight** - In pounds
   - **Height** - In inches
4. Click **"Record"**

**Note:** BMI is calculated automatically from weight and height.

### Vital Signs Overview

The vitals dashboard displays:
- **Latest Vitals** - Most recent measurements
- **Vital Trends** - Graph showing historical data
- **BP Classification** - Blood pressure status (Normal, Elevated, Stage 1, Stage 2)
- **Vital History** - Complete list of all recorded vitals

### Blood Pressure Classification

| Category | Systolic | Diastolic |
|----------|----------|-----------|
| Normal | < 120 | < 80 |
| Elevated | 120-129 | < 80 |
| Stage 1 Hypertension | 130-139 | 80-89 |
| Stage 2 Hypertension | ≥ 140 | ≥ 90 |

### Viewing Vital Trends

1. Go to **Vitals** section
2. The chart displays vital trends over time
3. Hover over data points to see exact values
4. Use date range selector to view specific periods

---

## Appointments

### Scheduling an Appointment

1. Navigate to **Appointments**
2. Click **"Schedule Appointment"**
3. Enter appointment details:
   - **Patient** (auto-filled if viewing patient detail)
   - **Date & Time** (required)
   - **Provider** (optional)
   - **Appointment Type** (optional) - e.g., "Follow-up", "Consultation"
   - **Notes** (optional)
4. Click **"Schedule"**

### Viewing Appointments

1. Go to **Appointments** section
2. View appointments in calendar or list format
3. Appointments are color-coded by status:
   - **Blue** - Scheduled
   - **Green** - Confirmed
   - **Gray** - Completed
   - **Red** - Cancelled

### Managing Appointment Status

1. Click on an appointment
2. Update status:
   - **Scheduled** - Initial appointment booking
   - **Confirmed** - Patient has confirmed attendance
   - **Completed** - Appointment has occurred
   - **Cancelled** - Appointment has been cancelled
   - **No-Show** - Patient did not attend
3. Click **"Update"**

### Calendar Views

- **Day View** - See all appointments for a specific day
- **Week View** - See appointments for the entire week
- **Month View** - Overview of all appointments in a month

---

## Best Practices

### Patient Data Entry

1. **Use Consistent Formatting** - Follow standard conventions for names, addresses
2. **Complete Demographics** - Enter as much information as possible
3. **Verify MRN** - Ensure MRN is unique and correctly entered
4. **Regular Updates** - Keep contact information current

### Clinical Documentation

1. **Be Specific** - Use clear, specific language in clinical notes
2. **Use Standards** - Use ICD codes for problems and standard medication names
3. **Document Timely** - Record information as close to the event as possible
4. **Review Before Signing** - Always review notes before signing

### Medication Management

1. **Update Status** - Mark medications as discontinued when stopped
2. **Track Dates** - Record start and end dates for all medications
3. **Note Allergies** - Ensure all allergies are documented
4. **Review Interactions** - Check for potential drug interactions

### Vital Signs

1. **Record Regularly** - Establish routine vital sign recording
2. **Use Consistent Technique** - Use same measurement method for consistency
3. **Note Abnormalities** - Document any unusual readings
4. **Follow Up** - Address abnormal vitals with appropriate action

---

## Troubleshooting

### Common Issues

**Issue: Cannot log in**
- Verify your credentials are correct
- Check if your account has been activated
- Clear browser cookies and try again
- Contact system administrator

**Issue: Patient not found in search**
- Verify spelling of patient name or MRN
- Try searching with partial name
- Check if patient status is "active"
- Ensure you have permission to view patient

**Issue: Cannot save changes**
- Verify all required fields are filled
- Check for duplicate MRN or email
- Ensure you have write permissions
- Try refreshing the page

**Issue: Vitals chart not displaying**
- Ensure vitals have been recorded
- Check date range selection
- Try refreshing the page
- Check browser compatibility

**Issue: Appointment not showing in calendar**
- Verify appointment date is in the future
- Check appointment status
- Try different calendar view
- Refresh the page

### Getting Help

1. **Check Documentation** - Refer to this user guide
2. **Contact Support** - Reach out to the EMR support team
3. **Report Issues** - Use the feedback form to report bugs
4. **Request Features** - Suggest improvements through feedback

### Performance Tips

1. **Use Search** - Instead of scrolling, use search to find patients
2. **Limit Date Ranges** - When viewing history, limit to relevant time period
3. **Close Unused Tabs** - Close browser tabs to improve performance
4. **Clear Cache** - Periodically clear browser cache
5. **Use Modern Browser** - Use latest version of Chrome, Firefox, or Safari

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open patient search |
| `Ctrl+N` / `Cmd+N` | Create new patient |
| `Escape` | Close dialog or modal |
| `Enter` | Submit form |
| `Tab` | Navigate between fields |

---

## Data Privacy & Security

- All data is encrypted in transit and at rest
- Access is controlled through role-based permissions
- All actions are logged for audit purposes
- Regular security updates are applied
- Comply with HIPAA and healthcare data protection regulations

---

## Support & Feedback

For questions, issues, or feedback:
- **Email:** support@cloudemr.example.com
- **Phone:** 1-800-EMR-HELP
- **Documentation:** See API_DOCUMENTATION.md for technical details
- **Status Page:** Check system status at status.cloudemr.example.com

---

**Last Updated:** May 26, 2026
**Version:** 1.0.0
