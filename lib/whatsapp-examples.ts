/**
 * WhatsApp Service Usage Examples
 * This file contains examples of how to use the WhatsApp service
 */

import WhatsAppService from './whatsapp-service';

/**
 * Example: Send a simple message to a single recipient
 */
export async function sendSimpleMessage() {
  const result = await WhatsAppService.sendMessage(
    '6281284842478', // Phone number without + or country code
    'Hello from Product Configurator! This is a test message.',
    'Product Configurator-App'
  );

  console.log('Message sent:', result);
  return result;
}

/**
 * Example: Send message to multiple recipients
 */
export async function sendBulkMessage() {
  const phoneNumbers = [
    '6281284842478',
    '6281234567890',
    '6289876543210'
  ];

  const result = await WhatsAppService.sendMultiMessage(
    phoneNumbers,
    'Important announcement: System maintenance scheduled for tomorrow.',
    'Product Configurator-System'
  );

  console.log('Bulk message result:', result);
  return result;
}

/**
 * Example: Send project notification
 */
export async function sendProjectCreatedNotification() {
  const result = await WhatsAppService.sendProjectNotification(
    ['6281284842478'], // Project manager's phone
    'New Office Building Construction',
    'created',
    'Budget: IDR 2,500,000,000\nDeadline: March 2025\nLocation: Jakarta Selatan'
  );

  console.log('Project notification sent:', result);
  return result;
}



/**
 * Example: Send bulk messages with rate limiting
 */
export async function sendBulkWithRateLimit() {
  const phoneNumbers = [
    '6281284842478',
    '6281234567890',
    '6289876543210',
    '6285556667777',
    '6281112223333'
  ];

  const result = await WhatsAppService.sendBulkMessages(
    phoneNumbers,
    '🎉 Product Configurator Update: New features released!\n\n📱 Enhanced BOM management\n📊 Advanced reporting\n🚀 Performance improvements\n\nVisit app.product-configurator.com to explore.',
    'Product Configurator-Updates',
    2, // Send 2 messages per batch
    2000 // 2 second delay between batches
  );

  console.log('Bulk messaging result:', result);
  return result;
}

/**
 * Example: Validate and format phone numbers
 */
export function validateAndFormatPhones() {
  const phones = [
    '081284842478',   // With leading 0
    '6281284842478',  // With country code
    '+6281284842478', // With + prefix
    '81284842478',    // Without any prefix
  ];

  phones.forEach(phone => {
    const isValid = WhatsAppService.validatePhoneNumber(phone);
    const formatted = WhatsAppService.formatPhoneNumber(phone);

    console.log(`Original: ${phone}`);
    console.log(`Valid: ${isValid}`);
    console.log(`Formatted: ${formatted}`);
    console.log('---');
  });
}

/**
 * Example: Integration with project management system
 * This would typically be called from API routes or event handlers
 */
export async function handleProjectEvent(
  eventType: 'created' | 'updated' | 'completed',
  projectData: {
    name: string;
    managerPhone?: string;
    teamPhones?: string[];
    details?: string;
  }
) {
  const { name, managerPhone, teamPhones, details } = projectData;

  // Send to project manager
  if (managerPhone) {
    await WhatsAppService.sendProjectNotification(
      [managerPhone],
      name,
      eventType,
      details
    );
  }

  // Send to team members
  if (teamPhones && teamPhones.length > 0) {
    await WhatsAppService.sendProjectNotification(
      teamPhones,
      name,
      eventType,
      details
    );
  }

  console.log(`Project ${eventType} notifications sent for: ${name}`);
}



// Export all examples for testing
export const examples = {
  sendSimpleMessage,
  sendBulkMessage,
  sendProjectCreatedNotification,
  sendBulkWithRateLimit,
  validateAndFormatPhones,
  handleProjectEvent
};
