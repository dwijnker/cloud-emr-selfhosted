# Cloud EMR - Comprehensive Electronic Health Record System

A modern, elegant, and fully-featured cloud-based Electronic Health Record (EMR) system built with React, Express, and tRPC. Designed with a minimalist interface inspired by leading healthcare platforms like Elation and Athena.

## 🎯 Overview

Cloud EMR is a production-ready EMR system that provides comprehensive patient management, clinical documentation, and healthcare workflow automation. Built with modern web technologies and best practices, it offers a clean, intuitive interface for healthcare providers.

### Key Features

✅ **Patient Management** - Complete patient records with demographics, insurance, and provider teams
✅ **Clinical Chart** - Problems, allergies, medications, immunizations, and medical histories
✅ **Visit Notes** - SOAP-style clinical documentation with templates and status tracking
✅ **Vitals Tracking** - Comprehensive vital signs recording with charting and trends
✅ **Appointments** - Calendar-based scheduling with status management
✅ **Orders Management** - Lab, imaging, and cardiac orders
✅ **Documents & Reports** - Clinical document management with tagging
✅ **Referrals** - Specialist referral tracking and management
✅ **Prescriptions** - Medication management and prescription tracking
✅ **Care Gaps** - Patient forms and quality measure tracking
✅ **Medical Intake** - AI-powered conversational symptom collection and intake chat

## 🏗️ Architecture

```
Frontend (React 19 + Tailwind CSS 4)
         ↓ tRPC API
Backend (Express 4 + tRPC 11)
         ↓ SQL Queries
Database (MySQL 8 / TiDB)
```

### Technology Stack

**Frontend:**
- React 19
- Vite 7
- Tailwind CSS 4
- shadcn/ui
- tRPC Client
- React Query
- Wouter (routing)

**Backend:**
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL2 Driver
- Zod (validation)

**Database:**
- MySQL 8 or TiDB
- 36 tables
- Comprehensive schema

**Testing & Quality:**
- Vitest
- 87 passing tests

## 📋 Project Structure

```
cloud-emr/
├── client/                    # React frontend
│   ├── src/pages/            # Page components
│   ├── src/components/       # UI components
│   └── src/lib/              # Utilities
├── server/                    # Express backend
│   ├── _core/                # Framework code
│   ├── routers.ts            # tRPC procedures
│   └── *.test.ts             # Test suites
├── drizzle/                   # Database schema
│   ├── schema.ts             # Table definitions
│   └── migrations/           # SQL migrations
├── shared/                    # Shared code
├── API_DOCUMENTATION.md       # API reference
├── USER_GUIDE.md             # User documentation
├── DEVELOPER_GUIDE.md        # Developer documentation
├── TESTING_GUIDE.md          # Testing guide
└── package.json              # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8 or TiDB

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/dwijnker/cloud-emr.git
cd cloud-emr
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```bash
# .env file (provided by Manus)
DATABASE_URL=mysql://user:password@localhost/cloud_emr
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://...
VITE_OAUTH_PORTAL_URL=https://...
OWNER_OPEN_ID=your-owner-open-id
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://...
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

4. **Run database migrations:**
```bash
pnpm db:push
```

5. **Start development server:**
```bash
pnpm dev
```

6. **Open browser:**
```
http://localhost:3000
```

## 📖 Documentation

### User Documentation
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user guide with feature walkthroughs

### Developer Documentation
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Architecture, setup, and development guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing strategy and best practices

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Watch Mode
```bash
pnpm exec vitest
```

### Coverage Report
```bash
pnpm exec vitest --coverage
```

### Test Files
- `server/patients.test.ts` - Patient management (11 tests)
- `server/clinical.test.ts` - Clinical chart (18 tests)
- `server/vitals-visits.test.ts` - Vitals & visits (19 tests)
- `server/appointments.test.ts` - Appointments (20 tests)
- `server/auth.logout.test.ts` - Authentication (1 test)
- `server/intake.security.test.ts` - Medical Intake security (18 tests)

**Total: 87 tests passing ✅**

## 🔧 Development

### Build for Production
```bash
pnpm build
```

### Format Code
```bash
pnpm format
```

### Type Check
```bash
pnpm check
```

### Database Migrations
```bash
pnpm db:push
```

## 📊 Database Schema

### Core Tables (36 total)

**Patient Management:**
- `users` - System users
- `patients` - Patient records
- `patientInsurance` - Insurance coverage
- `providerTeams` - Care team assignments

**Clinical Data:**
- `problems` - Patient problems/diagnoses
- `allergies` - Patient allergies
- `drugIntolerances` - Drug intolerances
- `medications` - Current medications
- `immunizations` - Vaccination records
- `familyHistories` - Family medical history
- `medicalHistories` - Past medical history

**Clinical Documentation:**
- `visitNotes` - SOAP-style visit notes
- `vitals` - Vital signs records
- `clinicalDocuments` - Medical documents
- `nonVisitNotes` - Non-visit clinical notes
- `reports` - Clinical reports
- `reportInternalNotes` - Report notes

**Healthcare Operations:**
- `appointments` - Scheduled appointments
- `labOrders` - Laboratory orders
- `labOrderTests` - Lab order test items
- `imagingOrders` - Imaging orders
- `cardiacOrders` - Cardiac orders

**Referrals & Prescriptions:**
- `referrals` - Specialist referrals
- `patientLetters` - Patient correspondence
- `prescriptions` - Medication prescriptions
- `prescriptionFills` - Prescription fills
- `prescriptionRefills` - Prescription refills

**Quality & Forms:**
- `careGapDefinitions` - Quality measures
- `careGaps` - Care gap instances
- `patientForms` - Patient forms
- `patientFormRequests` - Form requests
- `patientFormSubmissions` - Form responses

**Medical Intake:**
- `medicalIntakes` - Intake sessions
- `intakeChatMessages` - Intake chat history
- `intakeSymptoms` - Captured symptoms

**Utilities:**
- `documentTags` - Document categorization

## 🔐 Security

- **Authentication:** Manus OAuth 2.0
- **Authorization:** Role-based access control (admin/user)
- **Input Validation:** Zod schema validation on all inputs
- **SQL Injection Prevention:** Drizzle ORM parameterized queries
- **Session Management:** Secure HTTP-only cookies
- **Data Encryption:** HTTPS for all traffic

## 🎨 Design System

### Color Palette
- **Primary:** Modern blue (#3B82F6)
- **Accent:** Emerald green (#10B981)
- **Neutral:** Slate grays (#64748B)
- **Status:** Red (#EF4444), Yellow (#F59E0B), Green (#10B981)

### Typography
- **Font:** Inter (system font fallback)
- **Headings:** Bold, 24px-32px
- **Body:** Regular, 14px-16px
- **Monospace:** Courier New for code

### Components
- Premium card designs with subtle shadows
- Smooth transitions and animations
- Responsive grid layouts
- Accessible form controls
- Status badges and indicators

## 📱 Features

### Patient Management
- ✅ Search and filter patients
- ✅ Create new patient records
- ✅ View comprehensive patient profiles
- ✅ Edit patient demographics
- ✅ Manage insurance coverage
- ✅ Assign care team members
- ✅ Track patient status (active/inactive/deceased)

### Clinical Chart
- ✅ Problems list with ICD coding
- ✅ Allergy tracking with severity levels
- ✅ Medication management with dosage/frequency
- ✅ Immunization records with lot tracking
- ✅ Family medical history
- ✅ Past medical history

### Visit Notes
- ✅ SOAP-style documentation
- ✅ Visit templates
- ✅ Draft/completed/signed status
- ✅ Provider signature tracking
- ✅ Clinical summaries

### Vitals Tracking
- ✅ Record vital signs (BP, HR, Temp, Weight, Height)
- ✅ Automatic BMI calculation
- ✅ Blood pressure classification
- ✅ Vital trends charting
- ✅ Historical data tracking

### Appointments
- ✅ Schedule appointments
- ✅ Calendar views (day/week/month)
- ✅ Status tracking (scheduled/confirmed/completed/cancelled/no-show)
- ✅ Appointment reminders
- ✅ Provider assignment

### Orders Management
- ✅ Lab orders with compendiums
- ✅ Imaging orders
- ✅ Cardiac orders with test tracking
- ✅ Order status tracking

### Documents & Reports
- ✅ Clinical document management
- ✅ Report creation and tracking
- ✅ Document tagging and categorization
- ✅ Internal notes on reports

### Referrals
- ✅ Create specialist referrals
- ✅ Track referral status
- ✅ Patient correspondence letters
- ✅ Referral history

### Prescriptions
- ✅ Medication prescriptions
- ✅ Refill requests
- ✅ Prescription history
- ✅ Injection records

### Care Gaps
- ✅ Quality measure tracking
- ✅ Patient forms management
- ✅ Form submission tracking
- ✅ Care gap definitions

### Medical Intake
- ✅ AI-powered conversational symptom collection
- ✅ Real-time chat interface
- ✅ Automated symptom extraction and structured storage
- ✅ Cross-patient isolation with ownership validation

## 🚢 Deployment

### Manus Deployment
1. Create checkpoint: `webdev_save_checkpoint`
2. Click "Publish" in Management UI
3. Application deployed to Manus infrastructure
4. Custom domain configuration available

### Environment Setup
```bash
# Required environment variables
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
OWNER_OPEN_ID=...
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_URL=...
VITE_FRONTEND_FORGE_API_KEY=...
```

## 📈 Performance

- **Frontend Build:** ~2s
- **Backend Build:** ~5s
- **Test Suite:** ~500ms (87 tests)
- **Database Queries:** <100ms (optimized)
- **API Response:** <200ms average

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Write/update tests
4. Run `pnpm test` and `pnpm check`
5. Create pull request

### Code Style
- TypeScript for all code
- Prettier formatting
- ESLint compliance
- Descriptive commit messages

## 📝 API Examples

### Create Patient
```typescript
const newPatient = await trpc.patients.create.useMutation();
await newPatient.mutateAsync({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  mrn: "MRN123456",
});
```

### Record Vitals
```typescript
const createVital = trpc.vitals.createVital.useMutation();
await createVital.mutateAsync({
  patientId: 1,
  recordDate: new Date(),
  systolicBP: 120,
  diastolicBP: 80,
  heartRate: 72,
  temperature: 98.6,
  weight: 180,
  height: 70,
});
```

### Create Visit Note
```typescript
const createNote = trpc.visits.createVisitNote.useMutation();
await createNote.mutateAsync({
  patientId: 1,
  visitDate: new Date(),
  provider: "Dr. Smith",
  chiefComplaint: "Patient reports fever",
  historyOfPresentIllness: "Onset 2 days ago",
  physicalExam: "Temp 101.2F",
  assessment: "Acute bronchitis",
  plan: "Prescribe antibiotics",
  status: "completed",
});
```

## 🐛 Troubleshooting

### Build Issues
```bash
# macOS / Linux
rm -rf node_modules pnpm-lock.yaml

# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules; Remove-Item pnpm-lock.yaml

pnpm install
pnpm build
```

### Database Connection
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify credentials
- Check network connectivity

### Tests Failing
```bash
pnpm exec vitest          # Watch mode for debugging
```

## 📞 Support

- **Documentation:** See docs/ directory
- **Issues:** GitHub Issues
- **Email:** support@cloudemr.example.com
- **Status:** status.cloudemr.example.com

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Inspired by Elation Health and Athena Health EMR systems
- Built with modern web technologies
- Community contributions welcome

---

## Quick Links

- [API Documentation](./API_DOCUMENTATION.md)
- [User Guide](./USER_GUIDE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [GitHub Repository](https://github.com/dwijnker/cloud-emr)

---

**Version:** 1.0.0  
**Last Updated:** May 26, 2026  
**Status:** Production Ready ✅

---

## 🎓 Learning Resources

### For Users
- User Guide walkthrough
- Feature tutorials
- Best practices guide

### For Developers
- Developer Guide
- API Documentation
- Testing Guide
- Code examples

### External Resources
- [tRPC Documentation](https://trpc.io)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Drizzle ORM](https://orm.drizzle.team)

---

**Cloud EMR - Elegant Healthcare Technology** 🏥
