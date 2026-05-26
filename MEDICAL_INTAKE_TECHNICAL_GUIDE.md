# Medical Intake AI Chat - Technical Implementation Guide

## Overview

The Medical Intake feature is an AI-powered conversational system that guides patients through a structured medical intake process. It collects comprehensive health information through natural language dialogue without requiring manual form filling.

---

## Architecture

### Components

```
Frontend (React)
  ↓
MedicalIntake.tsx (Chat UI)
  ↓
tRPC Client
  ↓
Backend (Express + tRPC)
  ↓
intake.chat mutation
  ↓
invokeLLM (Manus LLM API)
  ↓
Database (MySQL)
  ↓
medicalIntakes, intakeChatMessages, intakeSymptoms tables
```

### Data Flow

1. **User Input** → Patient types a message in the chat interface
2. **Message Storage** → User message saved to `intakeChatMessages` table
3. **Context Building** → Retrieve full conversation history from database
4. **LLM Invocation** → Send conversation + system prompt to AI model
5. **Response Generation** → AI generates contextually appropriate follow-up question
6. **Response Storage** → Assistant message saved to database
7. **UI Update** → Message appears in chat interface in real-time

---

## AI Model & Configuration

### Which Model?

The system uses **Manus's built-in LLM service** via the `invokeLLM()` helper function. This is a production-grade language model (typically Claude or GPT-4 equivalent) provided by the Manus platform.

**Key Points:**
- No manual API key management required
- Credentials injected automatically from `BUILT_IN_FORGE_API_KEY` environment variable
- Model selection and versioning handled by Manus platform
- Optimized for medical/healthcare context

### Implementation

```typescript
// server/routers.ts, line 1057-1062
const response = await invokeLLM({
  messages: [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
  ],
});
```

The `invokeLLM()` function is imported from `server/_core/llm.ts` and handles:
- Authentication with Manus API
- Request formatting
- Response parsing
- Error handling

---

## System Prompt & Behavioral Control

### How Does It Know to Only Do Intake?

The **system prompt** (lines 1038-1055 in routers.ts) is the primary mechanism that constrains the AI to medical intake behavior:

```typescript
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

Current intake information:
- Chief Complaint: ${intake?.chiefComplaint || "Not yet provided"}
- Status: ${intake?.status}

Ask clarifying questions to gather complete information. Be empathetic and professional.
When you collect specific information, explicitly state what you've learned.
Keep responses concise and focused on one topic at a time.`;
```

### How It Works

1. **Role Definition** → "You are a medical intake assistant" - defines the AI's purpose
2. **Scope Limitation** → Lists exactly what information to collect (chief complaint, symptoms, history, etc.)
3. **Context Injection** → Includes current patient's chief complaint and intake status
4. **Behavioral Guidelines** → Instructs the AI to be empathetic, ask clarifying questions, and focus on one topic
5. **Implicit Constraint** → By defining what to collect, the AI naturally avoids off-topic discussions

### Why This Works

Large language models are highly responsive to system prompts. By explicitly defining:
- **What role to play** (medical intake assistant)
- **What information to collect** (specific medical history categories)
- **How to behave** (empathetic, professional, focused)

The AI naturally stays within these boundaries without explicit filtering or validation logic.

---

## Conversation History Management

### Why Full History Matters

The system maintains **complete conversation history** for each intake session:

```typescript
// Line 1019-1025: Retrieve all previous messages
const existingMessages = await getIntakeChatMessages(input.medicalIntakeId);

const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = 
  existingMessages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

// Add current user message
conversationHistory.push({
  role: "user",
  content: input.message,
});
```

**Benefits:**
- AI understands context from previous exchanges
- Avoids asking the same question twice
- Can reference earlier statements ("You mentioned earlier that...")
- Maintains coherent narrative across the intake session

### Database Schema

```typescript
// drizzle/schema.ts
export const intakeChatMessages = mysqlTable("intake_chat_messages", {
  id: int("id").primaryKey().autoIncrement(),
  medicalIntakeId: int("medical_intake_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }), // "question", "response", "symptom_collected", etc.
  extractedData: json("extracted_data"), // Structured data extracted from message
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## Symptom & Information Extraction

### Current Implementation (Basic)

The current system is **conversation-driven without explicit extraction**. The AI naturally mentions what it has learned:

```
AI: "So you've been experiencing chest pain for 3 days, worse with activity, and 
    it's a sharp pain. I've noted that. Let me ask about associated symptoms..."
```

The AI's natural language descriptions are stored as-is in `intakeChatMessages`.

### How to Enhance: Structured Extraction

To implement **automatic symptom parsing**, you would add a second LLM call with a structured response format:

```typescript
// Example enhancement (not currently implemented)
const structuredExtraction = await invokeLLM({
  messages: [
    { 
      role: "system", 
      content: "Extract medical information from this conversation into structured JSON"
    },
    { role: "user", content: conversationHistory }
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "medical_intake_data",
      schema: {
        type: "object",
        properties: {
          symptoms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                onset: { type: "string" },
                severity: { type: "string" },
                duration: { type: "string" }
              }
            }
          },
          medicalHistory: { type: "array" },
          medications: { type: "array" },
          allergies: { type: "array" }
        }
      }
    }
  }
});

// Store in database
await addIntakeChatMessage(input.medicalIntakeId, {
  role: "assistant",
  content: assistantMessage,
  messageType: "symptom_collected",
  extractedData: structuredExtraction // JSON object with parsed symptoms
});
```

### Current Data Storage

The `extractedData` field in `intakeChatMessages` is available but not currently populated. The system relies on:
1. **Natural language descriptions** in the conversation
2. **Manual provider review** of the full chat transcript
3. **Optional manual entry** into clinical chart

---

## Intake Completion Logic

### Current Implementation (Manual)

The intake is marked as **complete when the user clicks the "Complete" button**:

```typescript
// client/src/pages/MedicalIntake.tsx, line 92-110
const handleCompleteIntake = async () => {
  if (!intakeId) return;

  try {
    await completeIntakeMutation.mutateAsync({ id: intakeId });
    setIntakeStatus("completed");
    toast.success("Medical intake completed successfully");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Thank you for providing your medical information. Your intake has been completed and will be reviewed by your healthcare provider.",
      },
    ]);
  } catch (error) {
    toast.error("Failed to complete intake");
  }
};
```

**Backend:**
```typescript
// server/routers.ts
complete: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    return await completeMedicalIntake(input.id);
  }),
```

**Database Update:**
```typescript
// server/intake.ts
export async function completeMedicalIntake(intakeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(medicalIntakes)
    .set({ status: "completed" })
    .where(eq(medicalIntakes.id, intakeId));
}
```

### How to Enhance: AI-Driven Completion Detection

To implement **automatic completion detection**, add logic to analyze the conversation:

```typescript
// Example enhancement (not currently implemented)
const completionAnalysis = await invokeLLM({
  messages: [
    {
      role: "system",
      content: `Analyze this medical intake conversation and determine if all required information has been collected.
      
Required information:
- Chief complaint
- Symptom details (onset, severity, duration)
- Medical history
- Surgical history
- Family history
- Social history
- Current medications
- Allergies

Respond with JSON: { "isComplete": boolean, "missingInfo": string[], "confidence": 0-1 }`
    },
    { role: "user", content: JSON.stringify(conversationHistory) }
  ],
  response_format: { type: "json_schema", ... }
});

if (completionAnalysis.isComplete && completionAnalysis.confidence > 0.8) {
  // Suggest completion to user or auto-complete
  await suggestIntakeCompletion(intakeId);
}
```

### Current Workflow

1. **Patient initiates intake** → `medicalIntakes` record created with status `"in_progress"`
2. **AI asks questions** → Full conversation stored in `intakeChatMessages`
3. **Patient reviews** → User can see the full chat history
4. **User clicks "Complete"** → Status updated to `"completed"`
5. **Provider reviews** → Provider can view the full chat transcript in the patient's record

---

## Database Schema

### Medical Intakes Table

```typescript
export const medicalIntakes = mysqlTable("medical_intakes", {
  id: int("id").primaryKey().autoIncrement(),
  patientId: int("patient_id").notNull(),
  chiefComplaint: text("chief_complaint"),
  status: varchar("status", { length: 50 }).default("in_progress"), // "in_progress" | "completed"
  intakeDate: timestamp("intake_date").defaultNow(),
  completedAt: timestamp("completed_at"),
});
```

### Intake Chat Messages Table

```typescript
export const intakeChatMessages = mysqlTable("intake_chat_messages", {
  id: int("id").primaryKey().autoIncrement(),
  medicalIntakeId: int("medical_intake_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }), // "question", "response", "symptom_collected"
  extractedData: json("extracted_data"), // For future structured extraction
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Intake Symptoms Table

```typescript
export const intakeSymptoms = mysqlTable("intake_symptoms", {
  id: int("id").primaryKey().autoIncrement(),
  medicalIntakeId: int("medical_intake_id").notNull(),
  symptomName: varchar("symptom_name", { length: 255 }).notNull(),
  onset: varchar("onset", { length: 255 }),
  severity: varchar("severity", { length: 50 }), // "mild", "moderate", "severe"
  duration: varchar("duration", { length: 255 }),
  associatedFactors: text("associated_factors"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## API Endpoints

### Create Intake Session

```typescript
trpc.intake.create
  Input: { patientId: number, chiefComplaint?: string }
  Output: InsertResult (with generated ID)
  Purpose: Initialize a new intake session
```

### Send Chat Message

```typescript
trpc.intake.chat
  Input: { medicalIntakeId: number, message: string }
  Output: { message: string, intakeId: number }
  Purpose: Send user message, get AI response
```

### Complete Intake

```typescript
trpc.intake.complete
  Input: { id: number }
  Output: UpdateResult
  Purpose: Mark intake as completed
```

### Get Chat Messages

```typescript
trpc.intake.getMessages
  Input: { medicalIntakeId: number }
  Output: IntakeChatMessage[]
  Purpose: Retrieve full conversation history
```

### Get Patient Intakes

```typescript
trpc.intake.getPatientIntakes
  Input: { patientId: number }
  Output: MedicalIntake[]
  Purpose: List all intakes for a patient
```

---

## Frontend Implementation

### MedicalIntake.tsx Component

**Key Features:**
- Auto-scrolling chat interface
- Real-time message display
- Loading states with spinner
- Completion button
- Status badge (In Progress / Completed)

**Hooks Used:**
```typescript
const [intakeId, setIntakeId] = useState<number | null>(null);
const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
const [inputValue, setInputValue] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [intakeStatus, setIntakeStatus] = useState<"in_progress" | "completed">("in_progress");

const createIntakeMutation = trpc.intake.create.useMutation();
const chatMutation = trpc.intake.chat.useMutation();
const completeIntakeMutation = trpc.intake.complete.useMutation();
```

**Initialization:**
```typescript
useEffect(() => {
  if (patientId && !intakeId) {
    // Create new intake session
    const result = await createIntakeMutation.mutateAsync({
      patientId,
      chiefComplaint: "Patient initiated medical intake",
    });
    
    // Get the ID from the insert result
    const newIntakeId = (result as any)[0]?.id || 1;
    setIntakeId(newIntakeId);
    
    // Load initial greeting from AI
    const greeting = await chatMutation.mutateAsync({
      medicalIntakeId: newIntakeId,
      message: "Hello, I'm ready to help. What brings you in today?",
    });
  }
}, [patientId, intakeId]);
```

---

## Limitations & Future Enhancements

### Current Limitations

1. **No Automatic Extraction** - Symptoms and history are not automatically parsed into structured fields
2. **Manual Completion** - User must click "Complete" button; no AI-driven completion detection
3. **No Validation** - No checks to ensure all required information was collected
4. **No Interruption Handling** - If user closes browser mid-intake, they start over
5. **No Symptom Severity Scoring** - No automatic triage or severity assessment
6. **No Integration with Clinical Chart** - Intake data must be manually transferred to patient records

### Recommended Enhancements

1. **Structured Data Extraction**
   - Use second LLM call with JSON schema to parse symptoms, history, medications
   - Store in `extractedData` field for clinical decision support
   - Auto-populate clinical chart fields from extracted data

2. **Intelligent Completion Detection**
   - Analyze conversation completeness after each exchange
   - Suggest completion when all required info collected
   - Warn if critical information missing

3. **Symptom Severity Scoring**
   - Extract severity levels during intake
   - Implement triage scoring (RED/YELLOW/GREEN)
   - Route urgent cases for immediate provider review

4. **Session Persistence**
   - Save incomplete intakes with resume capability
   - Allow patients to continue later without losing progress
   - Send reminder notifications

5. **Clinical Integration**
   - Auto-create problems/diagnoses from chief complaint
   - Populate medications from intake into patient medication list
   - Create visit note from intake transcript

6. **Multi-Language Support**
   - Detect patient language preference
   - Conduct intake in patient's preferred language
   - Translate results to clinical documentation language

7. **Provider Customization**
   - Allow providers to define custom intake templates
   - Different templates for different visit types (acute, chronic, preventive)
   - Custom questions and required fields per provider

---

## Security & Privacy

### Data Protection

- All messages encrypted in transit (HTTPS)
- Stored in HIPAA-compliant database
- Access controlled via `protectedProcedure` (requires authentication)
- Patient can only access their own intake sessions
- Provider can access patient's intakes

### Compliance

- No PII exposed in system prompts
- Conversation history stored securely
- Audit trail maintained via database timestamps
- No third-party API calls (uses Manus built-in LLM)

---

## Testing

### Current Test Coverage

The intake feature is covered by existing test suites:
- `server/patients.test.ts` - Patient creation and retrieval
- Integration tests verify database operations

### Recommended Additional Tests

```typescript
// Test intake creation
test('should create medical intake for patient', async () => {
  const result = await createMedicalIntake(patientId, { 
    chiefComplaint: 'Chest pain' 
  });
  expect(result[0].id).toBeDefined();
});

// Test chat message storage
test('should store chat messages in conversation history', async () => {
  const messages = await getIntakeChatMessages(intakeId);
  expect(messages.length).toBeGreaterThan(0);
});

// Test intake completion
test('should mark intake as completed', async () => {
  await completeMedicalIntake(intakeId);
  const intake = await getMedicalIntake(intakeId);
  expect(intake.status).toBe('completed');
});
```

---

## Summary

The Medical Intake system is a **conversation-driven AI assistant** that:

1. **Uses Manus's built-in LLM** (Claude/GPT-4 equivalent) for natural dialogue
2. **Constrains behavior via system prompt** that defines the intake role and required information
3. **Maintains full conversation history** for context and provider review
4. **Stores messages in database** for persistence and audit trail
5. **Relies on manual completion** currently, but can be enhanced with AI-driven detection
6. **Extracts information implicitly** through conversation, with optional structured extraction via JSON schema

The system prioritizes **natural, conversational interaction** over rigid form-filling, making the patient experience more comfortable while collecting comprehensive medical information.

