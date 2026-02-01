/**
 * Inventories API Module
 * Handles all inventory-related API calls
 *
 * API Endpoints (from backend):
 * - POST api/Inventories - Create inventory
 * - GET api/Inventories - List all inventories
 * - GET api/Inventories/{id} - Get inventory by id
 * - PUT api/Inventories/{id} - Update inventory
 * - DELETE api/Inventories/{id} - Soft delete
 * - GET api/Inventories/{id}/contents - Get inventory contents (raw materials)
 * - POST api/Inventories/receive-from-qc - Receive approved QC into inventory
 */

import { API_BASE_URL, apiFetch } from './config.js';

/**
 * Get all inventories
 */
async function getAll() {
    return apiFetch(`${API_BASE_URL}/Inventories`);
}

/**
 * Get a single inventory by ID
 */
async function getById(id) {
    return apiFetch(`${API_BASE_URL}/Inventories/${id}`);
}

/**
 * Create a new inventory
 * Body: InventoryCreateDto (name, location, capacity, isActive, etc.)
 */
async function create(data) {
    return apiFetch(`${API_BASE_URL}/Inventories`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Update an existing inventory
 * Body: InventoryUpdateDto
 */
async function update(id, data) {
    return apiFetch(`${API_BASE_URL}/Inventories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Soft delete an inventory (mark inactive)
 */
async function deleteInventory(id) {
    return apiFetch(`${API_BASE_URL}/Inventories/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Get inventory contents (raw materials inside inventory)
 * Returns: IReadOnlyList<InventoryItemDto> (raw material + quantity)
 */
async function getContents(inventoryId) {
    return apiFetch(`${API_BASE_URL}/Inventories/${inventoryId}/contents`);
}

/**
 * Receive approved QC records into inventory
 * Body: InventoryReceiveFromQcDto (qualityControlId, inventoryId)
 */
async function receiveFromQC(data) {
    return apiFetch(`${API_BASE_URL}/Inventories/receive-from-qc`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Get available raw materials
 */
async function getAvailableRawMaterials() {
    try {
        return apiFetch(`${API_BASE_URL}/RawMaterials`);
    } catch (error) {
        console.error('Failed to fetch available raw materials:', error);
        return [];
    }
}

export const InventoriesAPI = {
    getAll,
    getById,
    create,
    update,
    delete: deleteInventory,
    getContents,
    receiveFromQC,
    getAvailableRawMaterials,
};

export default InventoriesAPI;
