/**
 * Inventories Page
 * Displays list of all inventories with CRUD operations
 */

import { InventoriesAPI } from '../api/inventories.js';
import { RawMaterialsAPI } from '../api/rawMaterials.js';
import { API_BASE_URL } from '../api/config.js';
import { Table, TableIcons } from '../components/table.js';
import { Modal, generateFormFields } from '../components/modal.js';
import { showToast } from '../app.js';

export class InventoriesPage {
    constructor(router) {
        this.router = router;
        this.container = document.getElementById('page-content');
        this.inventories = [];
        this.rawMaterials = [];
        this.loading = true;
        this.rawMaterialsLoading = true;
        this.modal = new Modal();
    }

    /**
     * Initialize and render the page
     */
    async init() {
        this.render();
        await Promise.all([this.loadInventories(), this.loadRawMaterials()]);
    }

    /**
     * Load inventories from API
     */
    async loadInventories() {
        this.loading = true;
        this.renderTable();

        try {
            this.inventories = await InventoriesAPI.getAll();
        } catch (error) {
            showToast('Failed to load inventories: ' + error.message, 'error');
            this.inventories = [];
        }

        this.loading = false;
        this.renderTable();
    }

    /**
     * Load raw materials from API
     */
    async loadRawMaterials() {
        this.rawMaterialsLoading = true;
        this.renderRawMaterialsTable();

        try {
            this.rawMaterials = await RawMaterialsAPI.getAll();
        } catch (error) {
            showToast('Failed to load raw materials: ' + error.message, 'error');
            this.rawMaterials = [];
        }

        this.rawMaterialsLoading = false;
        this.renderRawMaterialsTable();
    }

    /**
     * Get raw materials table columns
     */
    getRawMaterialsColumns() {
        return [
            {
                key: 'code',
                label: 'Code',
                width: '140px',
                render: (value) => value || '-',
            },
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description', render: (value) => value || '-' },
            {
                key: 'isActive',
                label: 'Status',
                width: '100px',
                render: (value) => {
                    const active = value === true;
                    const badgeClass = active ? 'badge-success' : 'badge-secondary';
                    return `<span class="badge ${badgeClass}">${active ? 'Active' : 'Inactive'}</span>`;
                },
            },
        ];
    }

    /**
     * Render raw materials table
     */
    renderRawMaterialsTable() {
        const container = document.getElementById('raw-materials-table');
        if (!container) return;

        const table = new Table({
            columns: this.getRawMaterialsColumns(),
            data: this.rawMaterials,
            loading: this.rawMaterialsLoading,
            emptyMessage: 'No raw materials found. Click "Add Raw Material" to create one.',
            emptyIcon: '🧱',
        });

        container.innerHTML = table.render();
        table.attachEventListeners(container);
    }

    /**
     * Get form fields for create/edit
     * Maps to InventoryCreateDto / InventoryUpdateDto
     */
    getFormFields(isEdit = false) {
        const fields = [
            { name: 'name', label: 'Inventory Name', required: true },
            { name: 'location', label: 'Location', required: true },
            {
                name: 'distanceToProductionHallMeters',
                label: 'Distance from Production Hall (m)',
                type: 'number',
                min: 0,
                step: 0.1,
                required: true,
            },
            {
                name: 'capacity',
                label: 'Capacity',
                type: 'number',
                min: 1,
                required: true,
            },
            {
                name: 'isActive',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                ],
                required: true,
            },
        ];

        // Add code field as read-only for edit mode
        if (isEdit) {
            fields.unshift({ name: 'code', label: 'Inventory Code', readonly: true });
        }

        return fields;
    }

    /**
     * Get status display text
     */
    getStatusText(inventory) {
        // Handle both `isActive` boolean and `status` string
        if (typeof inventory.isActive === 'boolean') {
            return inventory.isActive ? 'Active' : 'Inactive';
        }
        return inventory.status || 'Unknown';
    }

    /**
     * Check if inventory is active
     */
    isActive(inventory) {
        if (typeof inventory.isActive === 'boolean') {
            return inventory.isActive;
        }
        return inventory.status === 'Active';
    }

    /**
     * Get table columns configuration
     */
    getTableColumns() {
        return [
            {
                key: 'code',
                label: 'Inventory Code',
                width: '120px',
                render: (value) => value || '-',
            },
            { key: 'name', label: 'Inventory Name' },
            { key: 'location', label: 'Location' },
            {
                key: 'distanceToProductionHallMeters',
                label: 'Distance (m)',
                width: '100px',
                render: (value) => `${value || 0} m`,
            },
            {
                key: 'capacity',
                label: 'Capacity',
                width: '100px',
                render: (value, row) => {
                    const utilization = row.currentUtilization || 0;
                    return `${utilization}/${value || 0}`;
                },
            },
            {
                key: 'isActive',
                label: 'Status',
                width: '100px',
                render: (value, row) => {
                    const statusText = this.getStatusText(row);
                    const badgeClass = this.isActive(row) ? 'badge-success' : 'badge-secondary';
                    return `<span class="badge ${badgeClass}">${statusText}</span>`;
                },
            },
            {
                key: 'actions',
                label: 'Actions',
                width: '150px',
                type: 'actions',
                actions: [
                    {
                        id: 'view',
                        icon: TableIcons.view,
                        title: 'View Details',
                        class: 'btn-primary',
                    },
                    {
                        id: 'edit',
                        icon: TableIcons.edit,
                        title: 'Edit',
                        class: 'btn-secondary',
                    },
                    {
                        id: 'delete',
                        icon: TableIcons.delete,
                        title: 'Delete',
                        class: 'btn-danger',
                        isDisabled: (row) => !this.isActive(row),
                    },
                ],
            },
        ];
    }

    /**
     * Handle table actions
     */
    handleAction = async (action, row) => {
        switch (action) {
            case 'view':
                this.router.navigate(`/inventories/${row.id}`);
                break;
            case 'edit':
                this.showEditModal(row);
                break;
            case 'delete':
                this.confirmDelete(row);
                break;
        }
    };

    /**
     * Show create inventory modal
     */
    showCreateModal() {
        const fields = this.getFormFields(false);

        this.modal.open({
            title: 'Create New Inventory',
            content: `
                <form id="inventory-form">
                    ${generateFormFields(fields, { isActive: 'true' })}
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="submit" form="inventory-form" class="btn btn-primary">Create Inventory</button>
            `,
            onSubmit: async (data) => {
                await this.createInventory(data);
            },
        });
    }

    /**
     * Show edit inventory modal
     */
    showEditModal(inventory) {
        const fields = this.getFormFields(true);

        // Prepare data for form
        const formData = {
            ...inventory,
            isActive: String(this.isActive(inventory)),
        };

        this.modal.open({
            title: 'Edit Inventory',
            content: `
                <form id="inventory-form">
                    ${generateFormFields(fields, formData)}
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="submit" form="inventory-form" class="btn btn-primary">Save Changes</button>
            `,
            onSubmit: async (data) => {
                await this.updateInventory(inventory.id, data);
            },
        });
    }

    /**
     * Create new inventory
     */
    async createInventory(data) {
        this.modal.setLoading(true);

        try {
            await InventoriesAPI.create({
                name: data.name,
                location: data.location,
                distanceToProductionHallMeters: parseFloat(data.distanceToProductionHallMeters),
                capacity: parseInt(data.capacity),
                isActive: data.isActive === 'true',
            });

            showToast('Inventory created successfully', 'success');
            this.modal.close();
            await this.loadInventories();
        } catch (error) {
            showToast(error.message, 'error');
            this.modal.setLoading(false);
        }
    }

    /**
     * Update existing inventory
     */
    async updateInventory(id, data) {
        this.modal.setLoading(true);

        try {
            await InventoriesAPI.update(id, {
                name: data.name,
                location: data.location,
                distanceToProductionHallMeters: parseFloat(data.distanceToProductionHallMeters),
                capacity: parseInt(data.capacity),
                isActive: data.isActive === 'true',
            });

            showToast('Inventory updated successfully', 'success');
            this.modal.close();
            await this.loadInventories();
        } catch (error) {
            showToast(error.message, 'error');
            this.modal.setLoading(false);
        }
    }

    /**
     * Confirm and delete inventory
     */
    async confirmDelete(inventory) {
        const confirmed = await Modal.confirm({
            title: 'Delete Inventory',
            message: `Are you sure you want to delete inventory "${inventory.name}"? This action will soft-delete the record.`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
        });

        if (confirmed) {
            try {
                await InventoriesAPI.delete(inventory.id);
                showToast('Inventory deleted successfully', 'success');
                await this.loadInventories();
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    }

    /**
     * Render the table section
     */
    renderTable() {
        const tableContainer = document.getElementById('inventories-table');
        if (!tableContainer) return;

        const table = new Table({
            columns: this.getTableColumns(),
            data: this.inventories,
            loading: this.loading,
            onAction: this.handleAction,
            emptyMessage: 'No inventories found. Click "Add Inventory" to create one.',
            emptyIcon: '📦',
        });

        tableContainer.innerHTML = table.render();
        table.attachEventListeners(tableContainer);
    }

    /**
     * Render the full page
     */
    render() {
        this.container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Inventories</h1>
                    <p class="page-subtitle">Manage your warehouse inventories</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" id="btn-add-raw-material" style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Raw Material
                    </button>
                    <button class="btn btn-primary" id="btn-add-inventory" style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Inventory
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-body" id="inventories-table">
                    <!-- Inventories table will be rendered here -->
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 16px; font-weight: 600; margin: 0;">Raw Materials</h2>
                </div>
                <div class="card-body" id="raw-materials-table">
                    <!-- Raw materials table will be rendered here -->
                </div>
            </div>
        `;

        // Attach event listeners
        document.getElementById('btn-add-inventory').addEventListener('click', () => {
            this.showCreateModal();
        });
        document.getElementById('btn-add-raw-material').addEventListener('click', () => {
            this.showCreateRawMaterialModal();
        });
    }

    /**
     * Show create raw material modal
     */
    showCreateRawMaterialModal() {
        const fields = [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'purchaseInvoiceNumber', label: 'Purchase Invoice Number', type: 'text', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', min: 0.01, step: 0.01, required: true },
        ];

        this.modal.open({
            title: 'Add Raw Material',
            content: `
                <form id="raw-material-form" enctype="multipart/form-data">
                    ${generateFormFields(fields)}
                    <div class="form-group" style="margin-top: 16px;">
                        <label class="form-label required">Invoice PDF</label>
                        <label class="pdf-upload-area" id="pdf-upload-area">
                            <input type="file" name="invoicePdf" accept=".pdf" id="pdf-input" required style="display: none;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="12" y2="12"></line>
                                <line x1="15" y1="15" x2="12" y2="12"></line>
                            </svg>
                            <span id="pdf-label" style="font-size: 13px; color: var(--text-secondary);">Click to upload Invoice PDF</span>
                        </label>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="submit" form="raw-material-form" class="btn btn-primary">Add Raw Material</button>
            `,
            onSubmit: async (data) => {
                const fileInput = document.getElementById('pdf-input');
                if (!fileInput.files[0]) {
                    showToast('Please upload an Invoice PDF', 'error');
                    return;
                }
                await this.createRawMaterial(data, fileInput.files[0]);
            },
        });

        // File input change handler
        const pdfInput = document.getElementById('pdf-input');
        const pdfLabel = document.getElementById('pdf-label');
        const pdfArea = document.getElementById('pdf-upload-area');
        pdfInput.addEventListener('change', () => {
            if (pdfInput.files.length > 0) {
                pdfLabel.textContent = pdfInput.files[0].name;
                pdfLabel.style.color = 'var(--text-primary)';
                pdfArea.style.borderColor = 'var(--primary-color)';
            } else {
                pdfLabel.textContent = 'Click to upload Invoice PDF';
                pdfLabel.style.color = 'var(--text-secondary)';
                pdfArea.style.borderColor = '';
            }
        });
    }

    /**
     * Create new raw material
     */
    async createRawMaterial(data, pdfFile) {
        this.modal.setLoading(true);

        try {
            const formData = new FormData();
            formData.append('Name', data.name);
            formData.append('Description', data.description || '');
            formData.append('PurchaseInvoiceNumber', data.purchaseInvoiceNumber);
            formData.append('Quantity', data.quantity);
            if (pdfFile) {
                formData.append('InvoicePdf', pdfFile);
            }

            const response = await fetch(`${API_BASE_URL}/QualityControl/register-material-with-invoice`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const error = await response.json();
                    if (error.errors) {
                        errorMessage = Object.values(error.errors).flat().join(', ');
                    } else {
                        errorMessage = error.message || error.title || errorMessage;
                    }
                } catch (e) {}
                throw new Error(errorMessage);
            }

            showToast('Raw material created successfully', 'success');
            this.modal.close();
        } catch (error) {
            showToast(error.message, 'error');
            this.modal.setLoading(false);
        }
    }
}

export default InventoriesPage;
