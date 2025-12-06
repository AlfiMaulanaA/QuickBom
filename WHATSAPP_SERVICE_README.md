# WhatsApp Service Integration

This document explains how to use the WhatsApp service integrated into QuickBom for sending notifications and messages.

## Overview

The WhatsApp service uses the IoTech WhatsApp API to send messages through WhatsApp Business API. It provides both simple messaging and advanced project management notifications.

## Service Location

- **Service**: `lib/whatsapp-service.ts`
- **API Route**: `app/api/whatsapp/route.ts`
- **Examples**: `lib/whatsapp-examples.ts`

## Quick Start

### 1. Basic Message Sending

```typescript
import WhatsAppService from '@/lib/whatsapp-service';

// Send single message
const result = await WhatsAppService.sendMessage(
  '6281284842478', // Phone number without + or country code
  'Hello from QuickBom!',
  'QuickBom-App'
);

// Send to multiple recipients
const result = await WhatsAppService.sendMultiMessage(
  ['6281284842478', '6281234567890'],
  'Bulk announcement message',
  'QuickBom-System'
);
```

### 2. API Usage

```bash
# Test service availability
GET /api/whatsapp?action=test

# Validate phone number
GET /api/whatsapp?action=validate&phone=6281284842478

# Send single message
POST /api/whatsapp
{
  "phoneNumber": "6281284842478",
  "message": "Hello from QuickBom!",
  "source": "QuickBom-App"
}

# Send multiple messages
POST /api/whatsapp
{
  "phoneNumbers": ["6281284842478", "6281234567890"],
  "message": "Bulk message content",
  "source": "QuickBom-System"
}
```

## Project Management Notifications

### Project Events

```typescript
// Project created notification
await WhatsAppService.sendProjectNotification(
  ['6281284842478'], // Manager phone
  'New Construction Project',
  'created',
  'Budget: IDR 500M\nDeadline: March 2025'
);

// Project completed notification
await WhatsAppService.sendProjectNotification(
  ['6281284842478', '6281234567890'], // Team phones
  'Office Renovation',
  'completed',
  'Project finished ahead of schedule!'
);
```

### Timeline Events

```typescript
// Milestone completed
await WhatsAppService.sendTimelineNotification(
  ['6281284842478'],
  'Foundation Project',
  'milestone_completed',
  'Foundation work completed successfully'
);

// Delay warning
await WhatsAppService.sendTimelineNotification(
  ['6281284842478'],
  'Electrical Project',
  'delay_warning',
  'Task running 2 days behind schedule'
);
```

## Advanced Features

### Bulk Messaging with Rate Limiting

```typescript
const result = await WhatsAppService.sendBulkMessages(
  phoneNumbers,     // Array of phone numbers
  message,          // Message content
  'QuickBom-Bulk', // Source identifier
  5,               // Messages per batch
  2000             // Delay between batches (ms)
);
```

### Phone Number Validation

```typescript
// Validate Indonesian phone number
const isValid = WhatsAppService.validatePhoneNumber('081284842478'); // true

// Format phone number to standard format
const formatted = WhatsAppService.formatPhoneNumber('081284842478'); // '6281284842478'
```

## API Endpoints

### GET `/api/whatsapp`

**Query Parameters:**
- `action=test` - Test service availability
- `action=validate&phone={number}` - Validate phone number

### POST `/api/whatsapp`

**Request Body Options:**

1. **Single Message:**
```json
{
  "phoneNumber": "6281284842478",
  "message": "Hello!",
  "source": "QuickBom-App"
}
```

2. **Multiple Messages:**
```json
{
  "phoneNumbers": ["6281284842478", "6281234567890"],
  "message": "Bulk message",
  "source": "QuickBom-System"
}
```

3. **Project Notification:**
```json
{
  "type": "project",
  "phoneNumbers": ["6281284842478"],
  "projectName": "Construction Project",
  "notificationType": "created|updated|completed|overdue|milestone|task",
  "details": "Additional details"
}
```

4. **Timeline Notification:**
```json
{
  "type": "timeline",
  "phoneNumbers": ["6281284842478"],
  "projectName": "Timeline Project",
  "eventType": "timeline_created|task_completed|milestone_completed|delay_warning",
  "details": "Additional details"
}
```

5. **Bulk Messaging:**
```json
{
  "type": "bulk",
  "phoneNumbers": ["6281284842478", "6281234567890"],
  "message": "Bulk message",
  "batchSize": 10,
  "delay": 1000
}
```

## Response Format

All responses follow this structure:

```typescript
interface WhatsAppResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "data": { /* API response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to send WhatsApp message",
  "data": { /* Error details */ }
}
```

## Phone Number Format

The service accepts Indonesian phone numbers in various formats:
- `081284842478` (with leading 0)
- `6281284842478` (with country code)
- `+6281284842478` (with + prefix)
- `81284842478` (without prefix)

All formats are automatically validated and formatted to the standard `62xxxxxxxxx` format.

## Integration Examples

### Project Creation Hook

```typescript
// In your project creation API
export async function createProject(projectData) {
  // Create project in database
  const project = await prisma.project.create({ /* ... */ });

  // Send WhatsApp notification
  await WhatsAppService.sendProjectNotification(
    [project.managerPhone],
    project.name,
    'created',
    `Budget: ${project.budget}\nDeadline: ${project.deadline}`
  );

  return project;
}
```

### Timeline Monitoring

```typescript
// Check for upcoming deadlines and send alerts
export async function checkDeadlines() {
  const upcomingTasks = await prisma.projectTask.findMany({
    where: {
      dueDate: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      status: 'PENDING'
    },
    include: { project: true }
  });

  for (const task of upcomingTasks) {
    await WhatsAppService.sendTimelineNotification(
      [task.project.managerPhone],
      task.project.name,
      'delay_warning',
      `Task "${task.name}" due in ${Math.ceil((task.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days`
    );
  }
}
```

## Error Handling

Always handle errors appropriately:

```typescript
try {
  const result = await WhatsAppService.sendMessage(phone, message);

  if (!result.success) {
    console.error('WhatsApp error:', result.error);
    // Handle error (show toast, log, etc.)
  } else {
    console.log('Message sent successfully');
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Rate Limiting

The service includes built-in rate limiting for bulk messaging:
- Default batch size: 10 messages
- Default delay: 1000ms between batches
- Configurable for different use cases

## Security Notes

- Phone numbers are validated before sending
- Messages are logged for debugging purposes
- Source identifiers help track message origins
- Consider implementing user consent for notifications

## Testing

Use the test endpoints to verify service availability:

```bash
# Test service
curl -X GET "http://localhost:3000/api/whatsapp?action=test"

# Validate phone
curl -X GET "http://localhost:3000/api/whatsapp?action=validate&phone=6281284842478"

# Send test message
curl -X POST "http://localhost:3000/api/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"6281284842478","message":"Test message","source":"QuickBom-Test"}'
```

## Support

For issues with the WhatsApp service:
1. Check the IoTech API documentation
2. Verify phone number format
3. Ensure network connectivity
4. Check API response for detailed error messages

The service is designed to be robust and handle various edge cases while providing clear error messages for debugging.
