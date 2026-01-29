/**
 * Inventories Page
 * Displays list of all inventories with CRUD operations
 */

import { InventoriesAPI } from '../api/inventories.js';
import { Table, TableIcons } from '../components/table.js';
import { Modal, generateFormFields } from '../components/modal.js';
import { showToast } from '../app.js';

export class InventoriesPage {
    constructor(router) {
        this.router = router;
        this.container = document.getElementById('page-content');
        this.inventories = [];
        this.loading = true;
        this.modal = new Modal();
    }

    /**
     * Initialize and render the page
     */
    async init() {
        this.render();
        await this.loadInventories();
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
     * Get form fields for create/edit
     * Maps to InventoryCreateDto / InventoryUpdateDto
     */
    getFormFields(isEdit = false) {
        const fields = [
            { name: 'name', label: 'Inventory Name', required: true },
            { name: 'location', label: 'Location', required: true },
            {
                name: 'distanceFromProductionHall',
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
                key: 'distanceFromProductionHall',
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
                distanceFromProductionHall: parseFloat(data.distanceFromProductionHall),
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
                distanceFromProductionHall: parseFloat(data.distanceFromProductionHall),
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
                <button class="btn btn-primary" id="btn-add-inventory">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Inventory
                </button>
            </div>

            <div class="card">
                <div class="card-body" id="inventories-table">
                    <!-- Table will be rendered here -->
                </div>
            </div>
        `;

        // Attach event listeners
        document.getElementById('btn-add-inventory').addEventListener('click', () => {
            this.showCreateModal();
        });
    }
}

export default InventoriesPage;
