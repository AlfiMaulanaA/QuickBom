/**
 * WhatsApp API Route
 * Handles WhatsApp message sending requests
 */

import { NextRequest, NextResponse } from 'next/server';
import WhatsAppService from '@/lib/whatsapp-service';

// POST /api/whatsapp - Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumbers, phoneNumber, message, source, type, projectName, notificationType, eventType, details } = body;

    // Handle single message
    if (phoneNumber && message) {
      const result = await WhatsAppService.sendMessage(phoneNumber, message, source || 'QuickBom-API');
      return NextResponse.json(result);
    }

    // Handle multiple messages
    if (phoneNumbers && message) {
      const result = await WhatsAppService.sendMultiMessage(phoneNumbers, message, source || 'QuickBom-API');
      return NextResponse.json(result);
    }

    // Handle project notifications
    if (type === 'project' && phoneNumbers && projectName && notificationType) {
      const result = await WhatsAppService.sendProjectNotification(
        phoneNumbers,
        projectName,
        notificationType,
        details
      );
      return NextResponse.json(result);
    }

    // Handle timeline notifications
    if (type === 'timeline' && phoneNumbers && projectName && eventType) {
      const result = await WhatsAppService.sendTimelineNotification(
        phoneNumbers,
        projectName,
        eventType,
        details
      );
      return NextResponse.json(result);
    }

    // Handle bulk messages
    if (type === 'bulk' && phoneNumbers && message) {
      const batchSize = body.batchSize || 10;
      const delay = body.delay || 1000;
      const result = await WhatsAppService.sendBulkMessages(
        phoneNumbers,
        message,
        source || 'QuickBom-API',
        batchSize,
        delay
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp - Test endpoint and validation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const phoneNumber = searchParams.get('phone');

  try {
    if (action === 'validate' && phoneNumber) {
      const isValid = WhatsAppService.validatePhoneNumber(phoneNumber);
      const formatted = WhatsAppService.formatPhoneNumber(phoneNumber);

      return NextResponse.json({
        success: true,
        phoneNumber: phoneNumber,
        isValid,
        formatted,
        message: isValid ? 'Phone number is valid' : 'Phone number format is invalid'
      });
    }

    if (action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp service is available',
        service: 'IoTech WhatsApp API',
        endpoint: WhatsAppService['API_URL'],
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp API endpoint',
      endpoints: {
        POST: '/api/whatsapp - Send WhatsApp messages',
        'GET /test': '/api/whatsapp?action=test - Test service availability',
        'GET /validate': '/api/whatsapp?action=validate&phone=6281234567890 - Validate phone number'
      },
      examples: {
        single_message: {
          http_method: 'POST',
          description: 'Send single WhatsApp message',
          body: {
            phoneNumber: '6281234567890',
            message: 'Hello from QuickBom!',
            source: 'QuickBom-App'
          }
        },
        multiple_messages: {
          http_method: 'POST',
          description: 'Send message to multiple recipients',
          body: {
            phoneNumbers: ['6281234567890', '6289876543210'],
            message: 'Bulk message from QuickBom!',
            source: 'QuickBom-App'
          }
        },
        project_notification: {
          http_method: 'POST',
          description: 'Send project-related notification',
          body: {
            type: 'project',
            phoneNumbers: ['6281234567890'],
            projectName: 'New Construction Project',
            notificationType: 'created',
            details: 'Project budget: IDR 500,000,000'
          }
        },
        bulk_messaging: {
          http_method: 'POST',
          description: 'Send bulk messages with rate limiting',
          body: {
            type: 'bulk',
            phoneNumbers: ['6281234567890', '6289876543210', '6285556667777'],
            message: 'Important announcement from QuickBom!',
            batchSize: 10,
            delay: 1000
          }
        }
      }
    });

  } catch (error) {
    console.error('WhatsApp API GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
