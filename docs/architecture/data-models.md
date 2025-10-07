# Data Models

## Email Message (In-Memory Only - MVP)

**Purpose:** Represents an incoming email during processing. Not persisted to database in MVP.

**Key Attributes:**
- `from`: string - Sender email address
- `to`: string - Recipient email address (service address)
- `subject`: string - Email subject line
- `body`: string - Plain text email body
- `messageId`: string - Unique message identifier from email headers
- `inReplyTo`: string | null - Message-ID this email replies to
- `references`: string[] - Chain of message IDs in conversation thread
- `timestamp`: Date - When email was received

**Relationships:**
- None (stateless MVP - no persistence)

**TypeScript Interface:**
```typescript
interface IncomingEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  timestamp: Date;
}
```

## LLM Response (In-Memory Only - MVP)

**Purpose:** Represents the generated response from OpenAI API.

**Key Attributes:**
- `content`: string - Generated response text
- `model`: string - Model used (e.g., "gpt-4")
- `tokenCount`: number - Tokens used in generation
- `completionTime`: number - Time taken to generate (milliseconds)

**TypeScript Interface:**
```typescript
interface LLMResponse {
  content: string;
  model: string;
  tokenCount: number;
  completionTime: number;
}
```

## Outgoing Email (In-Memory Only - MVP)

**Purpose:** Represents an email being sent to the user.

**Key Attributes:**
- `from`: string - Service email address
- `to`: string - Recipient (original sender)
- `subject`: string - Email subject (with "Re:" prefix)
- `body`: string - Response content from LLM
- `inReplyTo`: string - Original message ID
- `references`: string[] - Updated thread references

**TypeScript Interface:**
```typescript
interface OutgoingEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo: string;
  references: string[];
}
```

**Note:** For Post-MVP database integration, these models will be persisted to PostgreSQL tables with additional fields for user management and conversation history.

---
