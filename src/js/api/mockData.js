/**
 * Mock Data for Development/Testing
 * Remove or disable this in production
 */

// Mock Inventories
export const mockInventories = [
    {
        id: '1',
        code: 'INV-001',
        name: 'Main Warehouse',
        location: 'Building A, Floor 1',
        distanceFromProductionHall: 50,
        capacity: 1000,
        status: 'Active',
    },
    {
        id: '2',
        code: 'INV-002',
        name: 'Secondary Storage',
        location: 'Building B, Floor 2',
        distanceFromProductionHall: 120,
        capacity: 500,
        status: 'Active',
    },
    {
        id: '3',
        code: 'INV-003',
        name: 'Cold Storage',
        location: 'Building C, Basement',
        distanceFromProductionHall: 200,
        capacity: 300,
        status: 'Inactive',
    },
];

// Mock Raw Materials by Inventory
export const mockRawMaterials = {
    '1': [
        { id: 'rm1', code: 'RM-001', name: 'Steel Sheets', quantity: 150, unit: 'kg' },
        { id: 'rm2', code: 'RM-002', name: 'Copper Wire', quantity: 75, unit: 'm' },
        { id: 'rm3', code: 'RM-003', name: 'Aluminum Bars', quantity: 200, unit: 'pcs' },
    ],
    '2': [
        { id: 'rm4', code: 'RM-004', name: 'Rubber Seals', quantity: 500, unit: 'pcs' },
        { id: 'rm5', code: 'RM-005', name: 'Plastic Pellets', quantity: 100, unit: 'kg' },
    ],
    '3': [],
};

// Mock QC Records
export const mockQCRecords = [
    {
        id: 'qc1',
        code: 'QC-001',
        purchaseInvoiceCode: 'PI-2024-001',
        rawMaterialId: 'rm6',
        rawMaterialName: 'Carbon Fiber',
        quantity: 50,
        unit: 'kg',
        supplierName: 'ABC Suppliers',
        status: 'Pending',
        invoicePdfUrl: '#invoice-pdf',
    },
    {
        id: 'qc2',
        code: 'QC-002',
        purchaseInvoiceCode: 'PI-2024-002',
        rawMaterialId: 'rm7',
        rawMaterialName: 'Titanium Alloy',
        quantity: 25,
        unit: 'kg',
        supplierName: 'XYZ Materials',
        status: 'Approved',
        invoicePdfUrl: '#invoice-pdf',
    },
    {
        id: 'qc3',
        code: 'QC-003',
        purchaseInvoiceCode: 'PI-2024-003',
        rawMaterialId: 'rm8',
        rawMaterialName: 'Glass Panels',
        quantity: 100,
        unit: 'pcs',
        supplierName: 'Glass Corp',
        status: 'Rejected',
        rejectionReason: 'Quality does not meet specifications',
        invoicePdfUrl: '#invoice-pdf',
    },
    {
        id: 'qc4',
        code: 'QC-004',
        purchaseInvoiceCode: 'PI-2024-004',
        rawMaterialId: 'rm9',
        rawMaterialName: 'Ceramic Tiles',
        quantity: 200,
        unit: 'pcs',
        supplierName: 'Tile Masters',
        status: 'Pending',
        invoicePdfUrl: '#invoice-pdf',
    },
];

// Available raw materials (from approved QC)
export const mockAvailableRawMaterials = [
    { id: 'rm7', code: 'RM-007', name: 'Titanium Alloy', availableQty: 25, unit: 'kg' },
];

// Counter for generating codes
let inventoryCounter = 4;
let qcCounter = 5;
let rawMaterialCounter = 10;

/**
 * Generate a new inventory code
 */
export function generateInventoryCode() {
    return `INV-${String(inventoryCounter++).padStart(3, '0')}`;
}

/**
 * Generate a new raw material code
 */
export function generateRawMaterialCode() {
    return `RM-${String(rawMaterialCounter++).padStart(3, '0')}`;
}

/**
 * Simulate API delay
 */
export function simulateDelay(ms = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
