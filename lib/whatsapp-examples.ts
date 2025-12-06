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
    'Hello from QuickBom! This is a test message.',
    'QuickBom-App'
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
    'QuickBom-System'
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
 * Example: Send timeline event notification
 */
export async function sendMilestoneCompletedNotification() {
  const result = await WhatsAppService.sendTimelineNotification(
    ['6281284842478', '6281234567890'], // Team members
    'Foundation Work Project',
    'milestone_completed',
    'Foundation completed 2 days ahead of schedule!\nNext: Structural work begins Monday.'
  );

  console.log('Timeline notification sent:', result);
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
    '🎉 QuickBom Update: New features released!\n\n📱 Enhanced timeline management\n📊 Advanced reporting\n🚀 Performance improvements\n\nVisit app.quickbom.com to explore.',
    'QuickBom-Updates',
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

/**
 * Example: Timeline monitoring and alerts
 */
export async function checkTimelineAndSendAlerts(projectId: string) {
  // This would typically fetch from database
  const mockTimelineData = {
    projectName: 'Shopping Mall Construction',
    tasks: [
      { id: 1, name: 'Foundation Work', dueDate: '2025-01-15', status: 'completed' },
      { id: 2, name: 'Structural Work', dueDate: '2025-02-10', status: 'in_progress' },
      { id: 3, name: 'Electrical Installation', dueDate: '2025-02-20', status: 'pending' }
    ],
    alertPhones: ['6281284842478'] // Project manager
  };

  const today = new Date();
  const upcomingTasks = mockTimelineData.tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue > 0 && task.status === 'pending';
  });

  if (upcomingTasks.length > 0) {
    const taskList = upcomingTasks.map(task =>
      `• ${task.name} - Due: ${new Date(task.dueDate).toLocaleDateString('id-ID')}`
    ).join('\n');

    await WhatsAppService.sendTimelineNotification(
      mockTimelineData.alertPhones,
      mockTimelineData.projectName,
      'delay_warning',
      `⚠️ Upcoming deadlines:\n\n${taskList}\n\nPlease ensure timely completion.`
    );

    console.log('Timeline alerts sent');
  }
}

// Export all examples for testing
export const examples = {
  sendSimpleMessage,
  sendBulkMessage,
  sendProjectCreatedNotification,
  sendMilestoneCompletedNotification,
  sendBulkWithRateLimit,
  validateAndFormatPhones,
  handleProjectEvent,
  checkTimelineAndSendAlerts
};
