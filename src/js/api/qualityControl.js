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

import { API_BASE_URL, apiFetch } from './config.js';

/**
 * Get all QC records
 */
async function getAll() {
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
}

/**
 * Get a single QC record by ID
 */
async function getById(id) {
    return apiFetch(`${API_BASE_URL}/QualityControl/${id}`);
}

/**
 * Create a new QC record with invoice PDF
 * Consumes: multipart/form-data
 */
async function createWithInvoice(formData) {
    const response = await fetch(`${API_BASE_URL}/QualityControl/with-invoice`, {
        method: 'POST',
        mode: 'cors',
        body: formData,
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
}

/**
 * Review a QC record (approve or reject)
 */
async function review(id, data) {
    return apiFetch(`${API_BASE_URL}/QualityControl/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Get QC statistics
 */
async function getStatistics() {
    const records = await getAll();
    return {
        total: records.length,
        pending: records.filter((r) => r.status === 'Pending').length,
        approved: records.filter((r) => r.status === 'Approved').length,
        rejected: records.filter((r) => r.status === 'Rejected').length,
    };
}

export const QualityControlAPI = {
    getAll,
    getById,
    createWithInvoice,
    review,
    getStatistics,
};

export default QualityControlAPI;
