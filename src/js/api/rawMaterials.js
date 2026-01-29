/**
 * Raw Materials API Module
 * Handles all raw material-related API calls
 */

import { USE_MOCK_API, API_BASE_URL, apiFetch } from './config.js';
import { simulateDelay } from './mockData.js';

// Mock raw materials data
let mockRawMaterialsList = [
    { id: 1, code: 'RM-001', name: 'Steel Sheets', description: 'High-grade steel sheets', isActive: true },
    { id: 2, code: 'RM-002', name: 'Copper Wire', description: 'Industrial copper wire', isActive: true },
    { id: 3, code: 'RM-003', name: 'Aluminum Bars', description: 'Aluminum alloy bars', isActive: true },
];

/**
 * Mock API Implementation
 */
const MockRawMaterialsAPI = {
    async getAll() {
        await simulateDelay();
        return mockRawMaterialsList.filter((m) => m.isActive);
    },

    async getById(id) {
        await simulateDelay();
        const material = mockRawMaterialsList.find((m) => m.id === parseInt(id));
        if (!material) {
            throw new Error('Raw material not found');
        }
        return material;
    },

    async create(data) {
        await simulateDelay();
        const newMaterial = {
            id: Date.now(),
            code: `RM-${String(mockRawMaterialsList.length + 1).padStart(3, '0')}`,
            ...data,
            isActive: true,
        };
        mockRawMaterialsList.push(newMaterial);
        return newMaterial;
    },

    async update(id, data) {
        await simulateDelay();
        const index = mockRawMaterialsList.findIndex((m) => m.id === parseInt(id));
        if (index === -1) {
            throw new Error('Raw material not found');
        }
        mockRawMaterialsList[index] = { ...mockRawMaterialsList[index], ...data };
        return mockRawMaterialsList[index];
    },

    async delete(id) {
        await simulateDelay();
        const index = mockRawMaterialsList.findIndex((m) => m.id === parseInt(id));
        if (index === -1) {
            throw new Error('Raw material not found');
        }
        mockRawMaterialsList[index].isActive = false;
        return { success: true };
    },
};

/**
 * Real API Implementation
 */
const RealRawMaterialsAPI = {
    async getAll() {
        return apiFetch(`${API_BASE_URL}/RawMaterials`);
    },

    async getById(id) {
        return apiFetch(`${API_BASE_URL}/RawMaterials/${id}`);
    },

    async create(data) {
        return apiFetch(`${API_BASE_URL}/RawMaterials`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id, data) {
        return apiFetch(`${API_BASE_URL}/RawMaterials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id) {
        return apiFetch(`${API_BASE_URL}/RawMaterials/${id}`, {
            method: 'DELETE',
        });
    },
};

// Export the appropriate API based on configuration
export const RawMaterialsAPI = USE_MOCK_API ? MockRawMaterialsAPI : RealRawMaterialsAPI;

export default RawMaterialsAPI;
