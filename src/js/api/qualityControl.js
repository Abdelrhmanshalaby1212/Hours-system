/**
 * Quality Control API Module
 * Handles all QC-related API calls
 *
 * API Endpoints (from backend):
 * - POST api/QualityControl/with-invoice - Register new QC with invoice PDF
 * - POST api/QualityControl/{id}/review - Review QC (approve/reject)
 * - GET api/QualityControl/{id} - Get QC record by id
 * - GET api/QualityControl - Get all QC records (assumed)
 */

import { USE_MOCK_API, API_BASE_URL, apiFetch } from './config.js';
import { mockQCRecords, mockAvailableRawMaterials, simulateDelay } from './mockData.js';

// Local copy of mock data for manipulation
let qcRecordsData = [...mockQCRecords];

/**
 * Mock API Implementation
 */
const MockQualityControlAPI = {
    async getAll() {
        await simulateDelay();
        return qcRecordsData;
    },

    async getById(id) {
        await simulateDelay();
        const record = qcRecordsData.find((r) => r.id === id || r.id === parseInt(id));
        if (!record) {
            throw new Error('QC record not found');
        }
        return record;
    },

    async createWithInvoice(formData) {
        await simulateDelay();
        const newRecord = {
            id: Date.now(),
            code: `QC-${String(qcRecordsData.length + 1).padStart(3, '0')}`,
            purchaseInvoiceCode: formData.get('purchaseInvoiceNumber'),
            rawMaterialId: parseInt(formData.get('rawMaterialId')),
            rawMaterialName: 'New Material',
            quantity: parseFloat(formData.get('quantity')),
            status: 'Pending',
            invoicePdfUrl: '#uploaded-invoice',
        };
        qcRecordsData.push(newRecord);
        return newRecord;
    },

    async review(id, data) {
        await simulateDelay();
        const index = qcRecordsData.findIndex((r) => r.id === id || r.id === parseInt(id));
        if (index === -1) {
            throw new Error('QC record not found');
        }

        if (qcRecordsData[index].status !== 'Pending') {
            throw new Error('Can only review pending records');
        }

        // Update status based on decision
        const isApproved = data.decision === 'Approved' || data.isApproved === true;
        qcRecordsData[index].status = isApproved ? 'Approved' : 'Rejected';

        if (!isApproved && data.comments) {
            qcRecordsData[index].rejectionReason = data.comments;
        }

        // If approved, add to available raw materials
        if (isApproved) {
            const record = qcRecordsData[index];
            mockAvailableRawMaterials.push({
                id: record.rawMaterialId,
                code: `RM-${record.rawMaterialId}`,
                name: record.rawMaterialName,
                availableQty: record.quantity,
                unit: record.unit || 'units',
            });
        }

        return qcRecordsData[index];
    },

    async getStatistics() {
        await simulateDelay();
        return {
            total: qcRecordsData.length,
            pending: qcRecordsData.filter((r) => r.status === 'Pending').length,
            approved: qcRecordsData.filter((r) => r.status === 'Approved').length,
            rejected: qcRecordsData.filter((r) => r.status === 'Rejected').length,
        };
    },
};

/**
 * Real API Implementation
 */
const RealQualityControlAPI = {
    /**
     * Get all QC records
     * Note: Backend does not have a "get all" endpoint, so we attempt
     * to fetch by sequential IDs until we get a 404.
     */
    async getAll() {
        const records = [];
        let id = 1;
        let consecutiveMisses = 0;
        while (consecutiveMisses < 3) {
            try {
                const record = await apiFetch(`${API_BASE_URL}/QualityControl/${id}`);
                records.push(record);
                consecutiveMisses = 0;
            } catch (e) {
                consecutiveMisses++;
            }
            id++;
        }
        return records;
    },

    /**
     * Get a single QC record by ID
     */
    async getById(id) {
        return apiFetch(`${API_BASE_URL}/QualityControl/${id}`);
    },

    /**
     * Create a new QC record with invoice PDF
     * Consumes: multipart/form-data
     * Form fields:
     * - PurchaseInvoiceNumber (string)
     * - RawMaterialId (int)
     * - Quantity (numeric)
     * - InvoicePdf (file)
     */
    async createWithInvoice(formData) {
        const response = await fetch(`${API_BASE_URL}/QualityControl/with-invoice`, {
            method: 'POST',
            mode: 'cors',
            body: formData, // Don't set Content-Type header for FormData
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const error = await response.json();
                errorMessage = error.message || error.title || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Review a QC record (approve or reject)
     * Body: QualityControlReviewDto (decision, reviewer info, comments, etc.)
     */
    async review(id, data) {
        return apiFetch(`${API_BASE_URL}/QualityControl/${id}/review`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get QC statistics (if endpoint exists)
     */
    async getStatistics() {
        const records = await this.getAll();
        return {
            total: records.length,
            pending: records.filter((r) => r.status === 'Pending').length,
            approved: records.filter((r) => r.status === 'Approved').length,
            rejected: records.filter((r) => r.status === 'Rejected').length,
        };
    },
};

// Export the appropriate API based on configuration
export const QualityControlAPI = USE_MOCK_API ? MockQualityControlAPI : RealQualityControlAPI;

export default QualityControlAPI;
