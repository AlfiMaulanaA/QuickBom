import { NextRequest, NextResponse } from "next/server";
import { CrmService } from "@/lib/services/crm";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'Estimator';
        const id = parseInt(searchParams.get('id') || '0');

        // Fetch inquiries from External CRM Service
        const inquiries = await CrmService.getInquiryDropdown(role, id);
        console.log(`API [inquiries]: Fetched ${inquiries?.length} items from CRM`);

        return NextResponse.json(inquiries);
    } catch (error: any) {
        console.error("Failed to fetch inquiries from CRM API:", error);
        return NextResponse.json(
            { error: "Failed to fetch inquiries from external system" },
            { status: 502 }
        );
    }
}
