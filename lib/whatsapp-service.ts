/**
 * WhatsApp Service
 * Provides functionality to send WhatsApp messages using IoTech API
 */

interface WhatsAppMessage {
  phone_num: string[];
  message: string;
  source: string;
}

interface WhatsAppResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

class WhatsAppService {
  private static readonly API_URL = process.env.WHATSAPP_API_URL || 'https://authserver-backend.iotech.my.id/send-multi-whatsapp';

  /**
   * Send WhatsApp message to single recipient
   * @param phoneNumber - Recipient phone number (without + or country code)
   * @param message - Message content
   * @param source - Source identifier for tracking
   * @returns Promise with response
   */
  static async sendMessage(
    phoneNumber: string,
    message: string,
    source: string = 'Product Configurator'
  ): Promise<WhatsAppResponse> {
    return this.sendMultiMessage([phoneNumber], message, source);
  }

  /**
   * Send WhatsApp message to multiple recipients
   * @param phoneNumbers - Array of recipient phone numbers (without + or country code)
   * @param message - Message content
   * @param source - Source identifier for tracking
   * @returns Promise with response
   */
  static async sendMultiMessage(
    phoneNumbers: string[],
    message: string,
    source: string = 'Product Configurator'
  ): Promise<WhatsAppResponse> {
    try {
      // Validate input
      if (!phoneNumbers || phoneNumbers.length === 0) {
        return {
          success: false,
          error: 'At least one phone number is required'
        };
      }

      if (!message || message.trim().length === 0) {
        return {
          success: false,
          error: 'Message content is required'
        };
      }

      // Prepare request payload
      const payload: WhatsAppMessage = {
        phone_num: phoneNumbers,
        message: message.trim(),
        source: source
      };

      // Make API request
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'WhatsApp message sent successfully',
          data: responseData
        };
      } else {
        return {
          success: false,
          error: responseData.message || 'Failed to send WhatsApp message',
          data: responseData
        };
      }

    } catch (error) {
      console.error('WhatsApp service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send project notification via WhatsApp
   * @param phoneNumbers - Array of recipient phone numbers
   * @param projectName - Project name
   * @param notificationType - Type of notification
   * @param details - Additional details
   * @returns Promise with response
   */
  static async sendProjectNotification(
    phoneNumbers: string[],
    projectName: string,
    notificationType: 'created' | 'updated' | 'completed' | 'overdue',
    details?: string
  ): Promise<WhatsAppResponse> {
    const messages = {
      created: `🎉 *Project Created*\n\nProject: ${projectName}\nStatus: New project has been created\n\nProduct Configurator Project Management`,
      updated: `📝 *Project Updated*\n\nProject: ${projectName}\nStatus: Project has been updated\n${details ? `\nDetails: ${details}` : ''}\n\nProduct Configurator Project Management`,
      completed: `✅ *Project Completed*\n\nProject: ${projectName}\nStatus: Project has been completed successfully!\n\n🎊 Congratulations!\n\nProduct Configurator Project Management`,
      overdue: `⚠️ *Project Overdue Alert*\n\nProject: ${projectName}\nStatus: Project is running behind schedule\n\nPlease review and take necessary actions.\n\nProduct Configurator Project Management`
    };

    const message = messages[notificationType];

    return this.sendMultiMessage(phoneNumbers, message, 'Product Configurator-Project');
  }



  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   * @returns boolean indicating if phone number is valid
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Indonesian phone number validation (with or without country code)
    const phoneRegex = /^(\+62|62|0)[8-9][0-9]{7,11}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  }

  /**
   * Format phone number to standard format
   * @param phoneNumber - Phone number to format
   * @returns formatted phone number
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Indonesian numbers
    if (cleaned.startsWith('0')) {
      // Remove leading 0 and add 62
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8') || cleaned.startsWith('9')) {
      // Add 62 prefix for numbers starting with 8 or 9
      cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62')) {
      // Add 62 if not already present
      cleaned = '62' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send bulk messages with rate limiting
   * @param phoneNumbers - Array of phone numbers
   * @param message - Message content
   * @param source - Source identifier
   * @param batchSize - Number of messages per batch (default: 10)
   * @param delay - Delay between batches in ms (default: 1000)
   * @returns Promise with consolidated response
   */
  static async sendBulkMessages(
    phoneNumbers: string[],
    message: string,
    source: string = 'Product Configurator',
    batchSize: number = 10,
    delay: number = 1000
  ): Promise<WhatsAppResponse> {
    const results: WhatsAppResponse[] = [];

    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      const result = await this.sendMultiMessage(batch, message, source);
      results.push(result);

      // Add delay between batches (except for the last batch)
      if (i + batchSize < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Check if all batches were successful
    const allSuccessful = results.every(result => result.success);

    return {
      success: allSuccessful,
      message: allSuccessful
        ? `Successfully sent ${phoneNumbers.length} messages`
        : `Some messages failed. Check individual results.`,
      data: {
        total: phoneNumbers.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    };
  }
}

export default WhatsAppService;
export type { WhatsAppMessage, WhatsAppResponse };
