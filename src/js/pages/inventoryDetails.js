/**
 * Inventory Details Page
 * Displays inventory details and manages raw materials (contents)
 *
 * Uses:
 * - GET api/Inventories/{id} - Get inventory details
 * - GET api/Inventories/{id}/contents - Get raw materials inside inventory
 * - POST api/Inventories/receive-from-qc - Receive approved QC into inventory
 */

import { InventoriesAPI } from '../api/inventories.js';
import { QualityControlAPI } from '../api/qualityControl.js';
import { Table, TableIcons } from '../components/table.js';
import { Modal, generateFormFields } from '../components/modal.js';
import { showToast } from '../app.js';

export class InventoryDetailsPage {
    constructor(router, inventoryId) {
        this.router = router;
        this.inventoryId = inventoryId;
        this.container = document.getElementById('page-content');
        this.inventory = null;
        this.contents = [];
        this.approvedQCRecords = [];
        this.loading = true;
        this.loadingContents = true;
        this.modal = new Modal();
    }

    /**
     * Initialize and render the page
     */
    async init() {
        this.renderLoading();
        await this.loadData();
    }

    /**
     * Load all necessary data
     */
    async loadData() {
        this.loading = true;
        this.loadingContents = true;

        try {
            // Load inventory details and contents in parallel
            const [inventory, contents] = await Promise.all([
                InventoriesAPI.getById(this.inventoryId),
                InventoriesAPI.getContents(this.inventoryId),
            ]);

            this.inventory = inventory;
            this.contents = contents || [];
            this.loading = false;
            this.loadingContents = false;

            this.render();
        } catch (error) {
            showToast('Failed to load inventory details: ' + error.message, 'error');
            this.router.navigate('/inventories');
        }
    }

    /**
     * Load approved QC records for receiving
     */
    async loadApprovedQCRecords() {
        try {
            const allQC = await QualityControlAPI.getAll();
            // Filter for approved records that haven't been received yet
            this.approvedQCRecords = allQC.filter(
                (qc) => qc.status === 'Approved' || qc.qcStatus === 'Approved'
            );
        } catch (error) {
            showToast('Failed to load approved QC records', 'error');
            this.approvedQCRecords = [];
        }
    }

    /**
     * Get status display text
     */
    getStatusText() {
        if (!this.inventory) return 'Unknown';
        if (typeof this.inventory.isActive === 'boolean') {
            return this.inventory.isActive ? 'Active' : 'Inactive';
        }
        return this.inventory.status || 'Unknown';
    }

    /**
     * Check if inventory is active
     */
    isActive() {
        if (!this.inventory) return false;
        if (typeof this.inventory.isActive === 'boolean') {
            return this.inventory.isActive;
        }
        return this.inventory.status === 'Active';
    }

    /**
     * Get status badge class
     */
    getStatusBadgeClass() {
        return this.isActive() ? 'badge-success' : 'badge-secondary';
    }

    /**
     * Get contents table columns
     * Based on InventoryItemDto (raw material + quantity)
     */
    getContentsColumns() {
        return [
            {
                key: 'rawMaterialCode',
                label: 'Material Code',
                width: '150px',
                render: (value, row) => value || row.code || '-',
            },
            {
                key: 'rawMaterialName',
                label: 'Material Name',
                render: (value, row) => value || row.name || '-',
            },
            {
                key: 'quantity',
                label: 'Quantity',
                width: '120px',
                render: (value, row) => `${value || 0} ${row.unit || 'units'}`,
            },
        ];
    }

    /**
     * Show receive from QC modal
     */
    async showReceiveFromQCModal() {
        await this.loadApprovedQCRecords();

        if (this.approvedQCRecords.length === 0) {
            showToast('No approved QC records available to receive', 'warning');
            return;
        }

        const fields = [
            {
                name: 'qualityControlId',
                label: 'Approved QC Record',
                type: 'select',
                options: this.approvedQCRecords.map((qc) => ({
                    value: qc.id,
                    label: `${qc.code || qc.id} - ${qc.rawMaterialName || 'Material'} (${qc.quantity} ${qc.unit || 'units'})`,
                })),
                required: true,
            },
        ];

        this.modal.open({
            title: 'Receive from Quality Control',
            content: `
                <form id="receive-form">
                    <p class="text-muted mb-4">
                        Select an approved QC record to receive into this inventory.
                        Only approved materials can be received.
                    </p>
                    ${generateFormFields(fields)}
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="submit" form="receive-form" class="btn btn-primary">Receive Material</button>
            `,
            onSubmit: async (data) => {
                await this.receiveFromQC(data);
            },
        });
    }

    /**
     * Receive from QC
     */
    async receiveFromQC(data) {
        this.modal.setLoading(true);

        try {
            await InventoriesAPI.receiveFromQC({
                qualityControlId: parseInt(data.qualityControlId),
                inventoryId: parseInt(this.inventoryId),
            });

            showToast('Material received successfully', 'success');
            this.modal.close();
            await this.refreshContents();
        } catch (error) {
            showToast(error.message, 'error');
            this.modal.setLoading(false);
        }
    }

    /**
     * Refresh contents list
     */
    async refreshContents() {
        this.loadingContents = true;
        this.renderContentsTable();

        try {
            this.contents = await InventoriesAPI.getContents(this.inventoryId);
        } catch (error) {
            showToast('Failed to refresh contents', 'error');
        }

        this.loadingContents = false;
        this.renderContentsTable();
    }

    /**
     * Render loading state
     */
    renderLoading() {
        this.container.innerHTML = `
            <div class="loading-text">
                <div class="spinner" style="margin: 0 auto 16px;"></div>
                <p>Loading inventory details...</p>
            </div>
        `;
    }

    /**
     * Render contents table
     */
    renderContentsTable() {
        const tableContainer = document.getElementById('contents-table');
        if (!tableContainer) return;

        const table = new Table({
            columns: this.getContentsColumns(),
            data: this.contents,
            loading: this.loadingContents,
            emptyMessage: 'No materials in this inventory. Click "Receive from QC" to add approved materials.',
            emptyIcon: '📦',
        });

        tableContainer.innerHTML = table.render();
        table.attachEventListeners(tableContainer);
    }

    /**
     * Navigate back to inventories list
     */
    goBack() {
        this.router.navigate('/inventories');
    }

    /**
     * Render the full page
     */
    render() {
        if (!this.inventory) {
            this.renderLoading();
            return;
        }

        const inv = this.inventory;
        const statusText = this.getStatusText();
        const badgeClass = this.getStatusBadgeClass();
        const canReceive = this.isActive();

        this.container.innerHTML = `
            <div class="details-header">
                <button class="details-back" id="btn-back" title="Back to Inventories">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="details-info">
                    <h1 class="details-title">${inv.name}</h1>
                    <p class="details-subtitle">Inventory Code: ${inv.code || inv.id}</p>
                </div>
                <span class="badge ${badgeClass}">
                    ${statusText}
                </span>
            </div>

            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${inv.location || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Distance from Production Hall</div>
                    <div class="detail-value">${inv.distanceToProductionHallMeters || 0} m</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Capacity</div>
                    <div class="detail-value">${inv.capacity || 0}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Current Utilization</div>
                    <div class="detail-value">${inv.currentUtilization || 0} / ${inv.capacity || 0}</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Inventory Contents</h3>
                    <button class="btn btn-primary btn-sm" id="btn-receive-qc"
                            ${!canReceive ? 'disabled title="Inventory is inactive"' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Receive from QC
                    </button>
                </div>
                <div class="card-body" id="contents-table">
                    <!-- Table will be rendered here -->
                </div>
            </div>
        `;

        // Attach event listeners
        document.getElementById('btn-back').addEventListener('click', () => this.goBack());

        const receiveBtn = document.getElementById('btn-receive-qc');
        if (receiveBtn && !receiveBtn.disabled) {
            receiveBtn.addEventListener('click', () => this.showReceiveFromQCModal());
        }

        // Render contents table
        this.renderContentsTable();
    }
}

export default InventoryDetailsPage;
