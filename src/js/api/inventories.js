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

import { USE_MOCK_API, API_BASE_URL, apiFetch } from './config.js';
import {
    mockInventories,
    mockRawMaterials,
    mockAvailableRawMaterials,
    generateInventoryCode,
    simulateDelay,
} from './mockData.js';

// Local copy of mock data for manipulation
let inventoriesData = [...mockInventories];
let rawMaterialsData = JSON.parse(JSON.stringify(mockRawMaterials));

/**
 * Mock API Implementation
 */
const MockInventoriesAPI = {
    async getAll() {
        await simulateDelay();
        return inventoriesData.filter((inv) => inv.isActive !== false);
    },

    async getById(id) {
        await simulateDelay();
        const inventory = inventoriesData.find((inv) => inv.id === parseInt(id) || inv.id === id);
        if (!inventory) {
            throw new Error('Inventory not found');
        }
        return inventory;
    },

    async create(data) {
        await simulateDelay();
        const newInventory = {
            id: Date.now(),
            code: generateInventoryCode(),
            ...data,
            isActive: true,
            currentUtilization: 0,
        };
        inventoriesData.push(newInventory);
        rawMaterialsData[newInventory.id] = [];
        return newInventory;
    },

    async update(id, data) {
        await simulateDelay();
        const index = inventoriesData.findIndex((inv) => inv.id === parseInt(id) || inv.id === id);
        if (index === -1) {
            throw new Error('Inventory not found');
        }
        inventoriesData[index] = { ...inventoriesData[index], ...data };
        return inventoriesData[index];
    },

    async delete(id) {
        await simulateDelay();
        const index = inventoriesData.findIndex((inv) => inv.id === parseInt(id) || inv.id === id);
        if (index === -1) {
            throw new Error('Inventory not found');
        }
        inventoriesData[index].isActive = false;
        return { success: true };
    },

    async getContents(inventoryId) {
        await simulateDelay();
        return rawMaterialsData[inventoryId] || [];
    },

    async receiveFromQC(data) {
        await simulateDelay();
        const { qualityControlId, inventoryId } = data;

        if (!rawMaterialsData[inventoryId]) {
            rawMaterialsData[inventoryId] = [];
        }

        // Simulate receiving QC material
        const newItem = {
            id: Date.now(),
            rawMaterialId: 1,
            rawMaterialName: 'Received Material',
            rawMaterialCode: 'RM-NEW',
            quantity: 100,
        };

        rawMaterialsData[inventoryId].push(newItem);
        return { success: true, transaction: newItem };
    },

    async getAvailableRawMaterials() {
        await simulateDelay();
        return mockAvailableRawMaterials;
    },
};

/**
 * Real API Implementation
 */
const RealInventoriesAPI = {
    /**
     * Get all inventories
     */
    async getAll() {
        return apiFetch(`${API_BASE_URL}/Inventories`);
    },

    /**
     * Get a single inventory by ID
     */
    async getById(id) {
        return apiFetch(`${API_BASE_URL}/Inventories/${id}`);
    },

    /**
     * Create a new inventory
     * Body: InventoryCreateDto (name, location, capacity, isActive, etc.)
     */
    async create(data) {
        return apiFetch(`${API_BASE_URL}/Inventories`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update an existing inventory
     * Body: InventoryUpdateDto
     */
    async update(id, data) {
        return apiFetch(`${API_BASE_URL}/Inventories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Soft delete an inventory (mark inactive)
     */
    async delete(id) {
        return apiFetch(`${API_BASE_URL}/Inventories/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get inventory contents (raw materials inside inventory)
     * Returns: IReadOnlyList<InventoryItemDto> (raw material + quantity)
     */
    async getContents(inventoryId) {
        return apiFetch(`${API_BASE_URL}/Inventories/${inventoryId}/contents`);
    },

    /**
     * Receive approved QC records into inventory
     * Body: InventoryReceiveFromQcDto (qualityControlId, inventoryId)
     */
    async receiveFromQC(data) {
        return apiFetch(`${API_BASE_URL}/Inventories/receive-from-qc`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get available raw materials (this calls the QC API to get approved records)
     * Note: This might need adjustment based on actual backend implementation
     */
    async getAvailableRawMaterials() {
        // This endpoint might not exist - we may need to get approved QC records instead
        try {
            return apiFetch(`${API_BASE_URL}/RawMaterials`);
        } catch (error) {
            console.error('Failed to fetch available raw materials:', error);
            return [];
        }
    },
};

// Export the appropriate API based on configuration
export const InventoriesAPI = USE_MOCK_API ? MockInventoriesAPI : RealInventoriesAPI;

export default InventoriesAPI;
