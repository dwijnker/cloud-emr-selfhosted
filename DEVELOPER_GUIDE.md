# Cloud EMR - Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Development](#api-development)
6. [Frontend Development](#frontend-development)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)

---

## Architecture Overview

Cloud EMR is built using a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  - Vite bundler                                              │
│  - Tailwind CSS 4                                            │
│  - shadcn/ui components                                      │
│  - React Query caching                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC API calls
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (Express 4)                         │
│  - tRPC 11 procedures                                        │
│  - Zod input validation                                      │
│  - Manus OAuth integration                                   │
│  - Session management                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL queries
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Database (MySQL/TiDB)                           │
│  - 33 tables for EMR data                                    │
│  - Drizzle ORM                                               │
│  - Migrations support                                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Type Safety** - End-to-end TypeScript with tRPC
2. **API-First** - All business logic in tRPC procedures
3. **Separation of Concerns** - Clear layers (UI, API, Database)
4. **Security** - Authentication on every protected procedure
5. **Scalability** - Stateless backend, database-driven state

---

## Project Structure

```
cloud-emr/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientDetail.tsx
│   │   │   ├── PatientCreate.tsx
│   │   │   ├── ClinicalChart.tsx
│   │   │   ├── VisitNotes.tsx
│   │   │   ├── Vitals.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── Referrals.tsx
│   │   │   ├── Prescriptions.tsx
│   │   │   └── CareGaps.tsx
│   │   ├── components/              # Reusable UI components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── trpc.ts              # tRPC client setup
│   │   │   └── utils.ts
│   │   ├── App.tsx                  # Main router
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── index.html
│   └── package.json
│
├── server/                          # Backend Express application
│   ├── _core/                       # Framework code
│   │   ├── index.ts                 # Express server setup
│   │   ├── context.ts               # tRPC context
│   │   ├── trpc.ts                  # tRPC setup
│   │   ├── oauth.ts                 # OAuth handling
│   │   ├── cookies.ts               # Session management
│   │   └── ...
│   ├── db.ts                        # Database query helpers
│   ├── routers.ts                   # Main tRPC router
│   ├── clinical.ts                  # Clinical chart helpers
│   ├── vitals.ts                    # Vitals helpers
│   ├── visits.ts                    # Visit notes helpers
│   ├── appointments.ts              # Appointments helpers
│   ├── orders.ts                    # Orders helpers
│   ├── documents.ts                 # Documents helpers
│   ├── prescriptions.ts             # Prescriptions helpers
│   ├── patients.test.ts             # Patient tests
│   ├── clinical.test.ts             # Clinical tests
│   ├── vitals-visits.test.ts        # Vitals/visits tests
│   └── appointments.test.ts         # Appointments tests
│
├── drizzle/                         # Database schema
│   ├── schema.ts                    # Table definitions
│   ├── relations.ts                 # Table relationships
│   ├── config.ts                    # Drizzle config
│   └── migrations/                  # SQL migrations
│
├── shared/                          # Shared code
│   ├── const.ts                     # Constants
│   ├── types.ts                     # Shared types
│   └── _core/
│       └── errors.ts                # Error definitions
│
├── storage/                         # File storage helpers
│   └── index.ts
│
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
├── API_DOCUMENTATION.md             # API reference
├── USER_GUIDE.md                    # User documentation
└── DEVELOPER_GUIDE.md               # This file
```

---

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **tRPC** - Type-safe API client
- **React Query** - Data fetching & caching
- **Wouter** - Lightweight routing
- **Zod** - Schema validation
- **date-fns** - Date utilities
- **Lucide React** - Icons

### Backend
- **Express 4** - Web framework
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database ORM
- **MySQL2** - Database driver
- **Zod** - Input validation
- **Jose** - JWT handling
- **Vitest** - Testing framework

### Database
- **MySQL 8** or **TiDB** - Relational database
- **Drizzle Kit** - Schema management

### DevOps
- **Node.js 22** - Runtime
- **pnpm** - Package manager
- **TypeScript 5.9** - Language

---

## Database Schema

### Core Tables

#### patients
Stores patient demographic information.

```typescript
{
  id: int (PK)
  openId: varchar (FK to users)
  firstName: varchar
  lastName: varchar
  dateOfBirth: date
  gender: enum('M', 'F', 'Other', 'Unknown')
  email: varchar
  phone: varchar
  address: varchar
  city: varchar
  state: varchar
  zipCode: varchar
  mrn: varchar (unique)
  ssn: varchar
  status: enum('active', 'inactive', 'deceased')
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### clinical_problems
Stores patient problems/diagnoses.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  description: varchar
  icdCode: varchar
  status: enum('active', 'inactive', 'resolved')
  onsetDate: date
  resolutionDate: date
  createdAt: timestamp
}
```

#### allergies
Stores patient allergies.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  allergen: varchar
  severity: enum('mild', 'moderate', 'severe')
  reaction: text
  status: enum('active', 'inactive', 'resolved')
  createdAt: timestamp
}
```

#### medications
Stores patient medications.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  medicationName: varchar
  dosage: varchar
  frequency: varchar
  route: varchar
  status: enum('active', 'discontinued', 'completed')
  startDate: date
  endDate: date
  notes: text
  createdAt: timestamp
}
```

#### immunizations
Stores patient immunization records.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  vaccineName: varchar
  administrationDate: date
  lot: varchar
  expirationDate: date
  manufacturer: varchar
  seriesDose: int
  seriesTotal: int
  createdAt: timestamp
}
```

#### vitals
Stores patient vital signs.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  recordDate: date
  bloodPressureSystolic: decimal
  bloodPressureDiastolic: decimal
  heartRate: decimal
  temperature: decimal
  weight: decimal
  height: decimal
  bmi: decimal
  createdAt: timestamp
}
```

#### visit_notes
Stores SOAP-style visit notes.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  visitDate: date
  visitType: varchar
  provider: varchar
  subjective: text
  objective: text
  assessment: text
  plan: text
  status: enum('draft', 'completed', 'signed')
  signedBy: varchar
  signedDate: date
  createdAt: timestamp
}
```

#### appointments
Stores appointment records.

```typescript
{
  id: int (PK)
  patientId: int (FK)
  appointmentDate: date
  provider: varchar
  appointmentType: varchar
  status: enum('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')
  notes: text
  createdAt: timestamp
}
```

---

## API Development

### Creating a New tRPC Procedure

1. **Define the procedure in `server/routers.ts`:**

```typescript
myFeature: protectedProcedure
  .input(
    z.object({
      patientId: z.number(),
      data: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Business logic here
    return await myFeatureHelper(input);
  }),
```

2. **Create a helper function in a separate file:**

```typescript
// server/myfeature.ts
export async function myFeatureHelper(input: any) {
  const db = await getDb();
  // Database operations
  return result;
}
```

3. **Use in frontend:**

```typescript
const mutation = trpc.myFeature.useMutation({
  onSuccess: () => {
    toast.success("Success!");
    trpc.useUtils().invalidate();
  },
});

mutation.mutate({ patientId: 1, data: "test" });
```

### Input Validation

Always validate inputs using Zod:

```typescript
.input(
  z.object({
    firstName: z.string().min(1, "First name required"),
    email: z.string().email("Invalid email"),
    age: z.number().min(0).max(150),
  })
)
```

### Error Handling

Use tRPC error codes:

```typescript
import { TRPCError } from "@trpc/server";

throw new TRPCError({
  code: "NOT_FOUND",
  message: "Patient not found",
});
```

---

## Frontend Development

### Creating a New Page

1. **Create page component:**

```typescript
// client/src/pages/MyFeature.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function MyFeature() {
  const { data, isLoading } = trpc.myFeature.useQuery();
  
  return (
    <div>
      {isLoading ? <p>Loading...</p> : <p>{data}</p>}
    </div>
  );
}
```

2. **Add route in `App.tsx`:**

```typescript
<Route path="/my-feature" component={MyFeature} />
```

3. **Add navigation link:**

```typescript
<Link href="/my-feature">My Feature</Link>
```

### Using shadcn/ui Components

```typescript
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MyComponent() {
  return (
    <Dialog>
      <Button>Open Dialog</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Dialog</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input placeholder="Enter name" />
          </div>
          <Button>Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Styling with Tailwind

```typescript
<div className="space-y-4 p-6 bg-background rounded-lg border border-border">
  <h1 className="text-2xl font-bold text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <Button className="w-full">Action</Button>
</div>
```

---

## Testing

### Running Tests

```bash
pnpm test                 # Run all tests
pnpm test --watch        # Watch mode
pnpm test --ui           # UI mode
```

### Writing Tests

```typescript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something", () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });

  it("should handle errors", () => {
    expect(() => myFunction()).toThrow();
  });
});
```

### Test Coverage

Current test coverage:
- Patient Management: 11 tests
- Clinical Chart: 18 tests
- Vitals & Visits: 19 tests
- Appointments: 20 tests
- **Total: 69 tests passing**

### Adding New Tests

1. Create test file: `server/feature.test.ts`
2. Write test cases using Vitest
3. Run `pnpm test` to verify
4. Ensure all tests pass before committing

---

## Deployment

### Build for Production

```bash
pnpm build              # Build frontend and backend
```

### Environment Variables

Required environment variables (set via Manus):
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing key
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth server URL
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL

### Deployment Process

1. Create a checkpoint with `webdev_save_checkpoint`
2. Click "Publish" in the Management UI
3. Application is deployed to Manus infrastructure
4. Custom domain can be configured in Settings

---

## Contributing

### Code Style

- Use TypeScript for all code
- Follow ESLint configuration
- Use Prettier for formatting
- Write descriptive commit messages

### Pull Request Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and write tests
3. Run `pnpm test` and `pnpm check`
4. Commit with descriptive message
5. Push and create pull request
6. Ensure all tests pass in CI/CD

### Commit Message Format

```
type(scope): subject

body

footer
```

Examples:
- `feat(patients): add patient search functionality`
- `fix(vitals): correct BMI calculation`
- `docs(api): update API documentation`
- `test(clinical): add allergy severity tests`

---

## Common Tasks

### Adding a New Database Table

1. Update `drizzle/schema.ts`:
```typescript
export const myTable = mysqlTable("my_table", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // ... other columns
});
```

2. Generate migration:
```bash
pnpm drizzle-kit generate
```

3. Review and apply migration via `webdev_execute_sql`

### Adding a New API Endpoint

1. Create helper function in `server/feature.ts`
2. Add procedure to `server/routers.ts`
3. Add tests in `server/feature.test.ts`
4. Use in frontend with `trpc.feature.useMutation()`

### Adding a New UI Component

1. Create component in `client/src/components/MyComponent.tsx`
2. Use shadcn/ui as base if applicable
3. Add Tailwind styling
4. Export from component barrel file
5. Use in pages

### Debugging

**Frontend:**
- Use browser DevTools
- Check React Query DevTools
- View network requests in Network tab

**Backend:**
- Check server logs in `.manus-logs/devserver.log`
- Add console.log statements
- Use debugger: `node --inspect`

---

## Performance Optimization

### Frontend
- Use React Query caching
- Implement code splitting
- Lazy load components
- Optimize images

### Backend
- Use database indexes
- Cache frequently accessed data
- Implement pagination
- Monitor query performance

### Database
- Use appropriate indexes
- Optimize queries
- Archive old data
- Monitor table sizes

---

## Security Considerations

1. **Authentication** - All procedures use `protectedProcedure`
2. **Input Validation** - All inputs validated with Zod
3. **SQL Injection** - Drizzle ORM prevents SQL injection
4. **CORS** - Configured for same-origin requests
5. **Session Management** - Secure cookies with HttpOnly flag
6. **Data Encryption** - HTTPS for all traffic

---

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is running
- Verify credentials
- Check network connectivity

### Tests Failing

- Run `pnpm test --watch` for debugging
- Check test output for specific errors
- Verify database is available for tests
- Review recent changes

---

## Resources

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev)

---

**Last Updated:** May 26, 2026
**Version:** 1.0.0
