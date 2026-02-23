import { NextRequest, NextResponse } from "next/server";
import { CrmService } from "@/lib/services/crm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const search = searchParams.get('search') || '';

    // Fetch from External CRM Service
    const crmData = await CrmService.getMaterials(page, size, search);

    return NextResponse.json(crmData);
  } catch (error: any) {
    console.error("Failed to fetch materials from external API:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials from external system" },
      { status: 502 } // Bad Gateway as we are proxying
    );
  }
}

// POST, PUT, DELETE are disabled since we are reading from external source
// Unless we want to support local "overrides" or syncing into a local cache table?
// For now, let's keep it read-only from the source as requested ("replace with api external").
