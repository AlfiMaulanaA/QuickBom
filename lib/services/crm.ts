
import axios from 'axios';

// Define types based on the user provided JSON structure
export interface CrmMaterial {
    id: number;
    mfr: string | null;
    partNumber: string | null; // Note: JSON shows "0"
    partDesc: string | null;
    partName: string;
    partFamily: string | null;
    currency: string;
    unitMeasure: string;
    price: number;
    priceToIDR: number;
    createdAt: string | null;
    updatedAt: string | null;
    // ... other fields we might not need immediately
}

export interface CrmApiResponse {
    content: CrmMaterial[];
    // Add pagination fields if available in the real API response, 
    // based on URL it seems to be standard Spring Boot Pageable or similar
    totalPages?: number;
    totalElements?: number;
    size?: number;
    number?: number; // current page
}

const CRM_API_BASE = process.env.CRM_API_BASE_URL || 'https://crm-local.iotech.my.id';
const CRM_API_TOKEN = process.env.CRM_API_TOKEN || '';

export const CrmService = {
    /**
     * Fetch materials from CRM External API
     * Endpoint: /product/estimator/page
     */
    async getMaterials(page = 0, size = 10, search = ''): Promise<CrmApiResponse> {
        try {
            const response = await axios.get(`${CRM_API_BASE}/product/estimator/page`, {
                params: {
                    page,
                    size,
                    search
                },
                headers: CRM_API_TOKEN ? { 'Authorization': `Bearer ${CRM_API_TOKEN}` } : {}
            });

            return response.data;
        } catch (error) {
            console.error('Failed to fetch materials from CRM:', error);
            // Return empty structure or throw depending on needs
            throw new Error('Failed to connect to External CRM API');
        }
    },

    /**
     * Fetch specific inquiry options
     * Endpoint: /inquirys/dropdown/inquiry/req
     */
    async getInquiryDropdown(role = 'Estimator', id = 0) {
        try {
            const response = await axios.get(`${CRM_API_BASE}/inquirys/dropdown/inquiry/req`, {
                params: {
                    role,
                    id
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch inquiries from CRM:', error);
            throw new Error('Failed to connect to External CRM API');
        }
    }
};
