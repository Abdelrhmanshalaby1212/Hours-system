/**
 * Raw Materials API Module
 * Handles all raw material-related API calls
 */

import { API_BASE_URL, apiFetch } from './config.js';

async function getAll() {
    return apiFetch(`${API_BASE_URL}/RawMaterials`);
}

async function getById(id) {
    return apiFetch(`${API_BASE_URL}/RawMaterials/${id}`);
}

async function create(data) {
    return apiFetch(`${API_BASE_URL}/RawMaterials`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function update(id, data) {
    return apiFetch(`${API_BASE_URL}/RawMaterials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteRawMaterial(id) {
    return apiFetch(`${API_BASE_URL}/RawMaterials/${id}`, {
        method: 'DELETE',
    });
}

export const RawMaterialsAPI = {
    getAll,
    getById,
    create,
    update,
    delete: deleteRawMaterial,
};

export default RawMaterialsAPI;
