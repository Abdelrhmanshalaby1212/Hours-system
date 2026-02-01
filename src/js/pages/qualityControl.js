/**
 * Quality Control Page
 * Displays QC records and handles review actions
 *
 * Uses:
 * - GET api/QualityControl - Get all QC records
 * - GET api/QualityControl/{id} - Get single QC record
 * - POST api/QualityControl/{id}/review - Review (approve/reject) QC
 */

import { QualityControlAPI } from '../api/qualityControl.js';
import { RawMaterialsAPI } from '../api/rawMaterials.js';
import { Table, TableIcons } from '../components/table.js';
import { Modal, generateFormFields } from '../components/modal.js';
import { showToast } from '../app.js';

export class QualityControlPage {
    constructor(router) {
        this.router = router;
        this.container = document.getElementById('page-content');
        this.qcRecords = [];
        this.rawMaterials = [];
        this.selectedRecord = null;
        this.loading = true;
        this.viewMode = 'list'; // 'list' or 'detail'
        this.modal = new Modal();
    }

    /**
     * Initialize and render the page
     */
    async init() {
        this.render();
        await this.loadRawMaterials();
        await this.loadQCRecords();
    }

    /**
     * Load QC records from API
     */
    async loadQCRecords() {
        this.loading = true;
        this.renderTable();

        try {
            const records = await QualityControlAPI.getAll();
            // Resolve raw material names from IDs
            this.qcRecords = records.map((r) => {
                const material = this.rawMaterials.find((m) => m.id === r.rawMaterialId);
                return { ...r, rawMaterialName: material ? material.name : '-' };
            });
        } catch (error) {
            showToast('Failed to load QC records: ' + error.message, 'error');
            this.qcRecords = [];
        }

        this.loading = false;
        this.renderTable();
    }

    /**
     * Load raw materials for the create form
     */
    async loadRawMaterials() {
        try {
            this.rawMaterials = await RawMaterialsAPI.getAll();
        } catch (error) {
            console.error('Failed to load raw materials:', error);
            this.rawMaterials = [];
        }
    }

    /**
     * Get status from QC record (handles different field names)
     */
    getStatus(record) {
        return record.status || record.qcStatus || 'Pending';
    }

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        const normalizedStatus = String(status).toLowerCase();
        if (normalizedStatus === 'approved') return 'badge-success';
        if (normalizedStatus === 'rejected') return 'badge-danger';
        return 'badge-warning'; // Pending
    }

    /**
     * Check if record is pending
     */
    isPending(record) {
        const status = this.getStatus(record);
        return String(status).toLowerCase() === 'pending';
    }

    /**
     * Get table columns configuration
     */
    getTableColumns() {
        return [
            {
                key: 'code',
                label: 'QC Code',
                width: '120px',
                render: (value, row) => value || `QC-${row.id}`,
            },
            {
                key: 'purchaseInvoiceNumber',
                label: 'Invoice Code',
                width: '140px',
                render: (value, row) => value || row.purchaseInvoiceCode || '-',
            },
            {
                key: 'rawMaterialName',
                label: 'Raw Material',
                render: (value, row) => value || row.rawMaterial?.name || '-',
            },
            {
                key: 'quantity',
                label: 'Quantity',
                width: '100px',
                render: (value, row) => `${value || 0} ${row.unit || 'units'}`,
            },
            {
                key: 'status',
                label: 'Status',
                width: '100px',
                render: (value, row) => {
                    const status = this.getStatus(row);
                    const badgeClass = this.getStatusBadgeClass(status);
                    return `<span class="badge ${badgeClass}">${status}</span>`;
                },
            },
            {
                key: 'actions',
                label: 'Actions',
                width: '120px',
                type: 'actions',
                actions: [
                    {
                        id: 'view',
                        icon: TableIcons.view,
                        title: 'View Details',
                        class: 'btn-primary',
                    },
                    {
                        id: 'review',
                        icon: TableIcons.check,
                        title: 'Review',
                        class: 'btn-success',
                        isDisabled: (row) => !this.isPending(row),
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
            case 'review':
                this.showRecordDetails(row);
                break;
        }
    };

    /**
     * Show record details view
     */
    async showRecordDetails(record) {
        // Fetch full record details if needed
        try {
            this.selectedRecord = await QualityControlAPI.getById(record.id);
        } catch (error) {
            this.selectedRecord = record;
        }
        this.viewMode = 'detail';
        this.renderDetailView();
    }

    /**
     * Go back to list view
     */
    backToList() {
        this.selectedRecord = null;
        this.viewMode = 'list';
        this.render();
        this.renderTable();
    }

    /**
     * Approve QC record
     */
    async approveRecord() {
        if (!this.selectedRecord || !this.isPending(this.selectedRecord)) return;

        const confirmed = await Modal.confirm({
            title: 'Approve QC Record',
            message: `Are you sure you want to approve this QC record?
                      This will make the raw material available for inventory allocation.`,
            confirmText: 'Approve',
            confirmClass: 'btn-success',
        });

        if (confirmed) {
            try {
                // QualityControlReviewDto structure
                await QualityControlAPI.review(this.selectedRecord.id, {
                    decision: 'Approved',
                    isApproved: true,
                    reviewerName: 'System User',
                    comments: '',
                });

                showToast('QC record approved successfully', 'success');

                // Update local state
                this.selectedRecord.status = 'Approved';
                this.selectedRecord.qcStatus = 'Approved';
                const recordIndex = this.qcRecords.findIndex(
                    (r) => r.id === this.selectedRecord.id
                );
                if (recordIndex !== -1) {
                    this.qcRecords[recordIndex].status = 'Approved';
                    this.qcRecords[recordIndex].qcStatus = 'Approved';
                }

                this.renderDetailView();
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    }

    /**
     * Reject QC record
     */
    async rejectRecord() {
        if (!this.selectedRecord || !this.isPending(this.selectedRecord)) return;

        // Show rejection reason modal
        this.modal.open({
            title: 'Reject QC Record',
            content: `
                <form id="reject-form">
                    <p class="text-muted mb-4">
                        Rejecting this QC record will stop the procurement process for this material.
                    </p>
                    <div class="form-group">
                        <label class="form-label required">Rejection Reason</label>
                        <textarea class="form-control" name="comments" rows="3" required
                                  placeholder="Please provide a reason for rejection..."></textarea>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="submit" form="reject-form" class="btn btn-danger">Reject Record</button>
            `,
            onSubmit: async (data) => {
                await this.processRejection(data.comments);
            },
        });
    }

    /**
     * Process rejection with reason
     */
    async processRejection(reason) {
        this.modal.setLoading(true);

        try {
            // QualityControlReviewDto structure
            await QualityControlAPI.review(this.selectedRecord.id, {
                decision: 'Rejected',
                isApproved: false,
                reviewerName: 'System User',
                comments: reason,
            });

            showToast('QC record rejected', 'success');

            // Update local state
            this.selectedRecord.status = 'Rejected';
            this.selectedRecord.qcStatus = 'Rejected';
            this.selectedRecord.rejectionReason = reason;
            this.selectedRecord.comments = reason;

            const recordIndex = this.qcRecords.findIndex(
                (r) => r.id === this.selectedRecord.id
            );
            if (recordIndex !== -1) {
                this.qcRecords[recordIndex].status = 'Rejected';
                this.qcRecords[recordIndex].qcStatus = 'Rejected';
            }

            this.modal.close();
            this.renderDetailView();
        } catch (error) {
            showToast(error.message, 'error');
            this.modal.setLoading(false);
        }
    }

    /**
     * Show create QC modal (with invoice upload)
     */
    async showCreateModal() {
        await this.loadRawMaterials();

        if (this.rawMaterials.length === 0) {
            showToast('No raw materials available. Please create raw materials first.', 'warning');
            return;
        }

        const fields = [
            {
                name: 'purchaseInvoiceNumber',
                label: 'Purchase Invoice Number',
                required: true,
            },
            {
                name: 'rawMaterialId',
                label: 'Raw Material',
                type: 'select',
                options: this.rawMaterials.map((m) => ({
                    value: m.id,
                    label: m.name || `Material ${m.id}`,
                })),
                required: true,
            },
            {
                name: 'quantity',
                label: 'Quantity',
                type: 'number',
                min: 0.01,
                step: 0.01,
                required: true,
            },
        ];

        this.modal.open({
            title: 'Register New QC',
            content: `
                <form id="qc-form" enctype="multipart/form-data">
                    ${generateFormFields(fields)}
                    <div class="form-group">
                        <label class="form-label required">Invoice PDF</label>
                        <input type="file" class="form-control" name="invoicePdf" accept=".pdf" required>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="submit" form="qc-form" class="btn btn-primary">Create QC Record</button>
            `,
            onSubmit: async (data, form) => {
                await this.createQCRecord(form);
            },
        });
    }

    /**
     * Create QC record with invoice
     */
    async createQCRecord(form) {
        this.modal.setLoading(true);

        try {
            const formData = new FormData(form);
            await QualityControlAPI.createWithInvoice(formData);

            showToast('QC record created successfully', 'success');
            this.modal.close();
            await this.loadQCRecords();
        } catch (error) {
            showToast(error.message, 'error');
            this.modal.setLoading(false);
        }
    }

    /**
     * Render the table section
     */
    renderTable() {
        const tableContainer = document.getElementById('qc-table');
        if (!tableContainer) return;

        const table = new Table({
            columns: this.getTableColumns(),
            data: this.qcRecords,
            loading: this.loading,
            onAction: this.handleAction,
            emptyMessage: 'No QC records found. Click "New QC Record" to create one.',
            emptyIcon: '📋',
        });

        tableContainer.innerHTML = table.render();
        table.attachEventListeners(tableContainer);
    }

    /**
     * Render the detail view
     */
    renderDetailView() {
        if (!this.selectedRecord) return;

        const record = this.selectedRecord;
        const status = this.getStatus(record);
        const isPending = this.isPending(record);
        const isApproved = String(status).toLowerCase() === 'approved';
        const isRejected = String(status).toLowerCase() === 'rejected';
        const badgeClass = this.getStatusBadgeClass(status);

        // Get invoice URL
        const invoiceUrl = record.invoicePdfUrl || record.invoiceFilePath;

        this.container.innerHTML = `
            <div class="details-header">
                <button class="details-back" id="btn-back" title="Back to QC List">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="details-info">
                    <h1 class="details-title">QC Review</h1>
                    <p class="details-subtitle">QC Code: ${record.code || `QC-${record.id}`}</p>
                </div>
                <span class="badge ${badgeClass}">
                    ${status}
                </span>
            </div>

            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Purchase Invoice</div>
                    <div class="detail-value">${record.purchaseInvoiceNumber || record.purchaseInvoiceCode || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Raw Material</div>
                    <div class="detail-value">${record.rawMaterialName || record.rawMaterial?.name || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Quantity</div>
                    <div class="detail-value">${record.quantity || 0} ${record.unit || 'units'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Supplier</div>
                    <div class="detail-value">${record.supplierName || record.supplier?.name || '-'}</div>
                </div>
            </div>

            ${invoiceUrl ? `
                <div class="card mb-4">
                    <div class="card-body">
                        <a href="${invoiceUrl}" target="_blank" class="pdf-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            View Invoice PDF
                        </a>
                    </div>
                </div>
            ` : ''}

            ${isPending ? `
                <div class="qc-review-section">
                    <h4 class="qc-review-title">Review Actions</h4>
                    <p class="text-muted mb-4">
                        Review the invoice and material details before making a decision.
                        Approved materials will be available for inventory allocation.
                    </p>
                    <div class="qc-review-actions">
                        <button class="btn btn-success" id="btn-approve">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Approve
                        </button>
                        <button class="btn btn-danger" id="btn-reject">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Reject
                        </button>
                    </div>
                </div>
            ` : ''}

            ${isApproved ? `
                <div class="qc-status-display approved">
                    <div class="qc-status-icon">✓</div>
                    <div class="qc-status-text">Approved</div>
                    <p class="text-muted mt-2">This QC record has been approved. Material is available for inventory.</p>
                </div>
            ` : ''}

            ${isRejected ? `
                <div class="qc-status-display rejected">
                    <div class="qc-status-icon">✗</div>
                    <div class="qc-status-text">Rejected</div>
                    ${record.rejectionReason || record.comments ? `
                        <p class="text-muted mt-2"><strong>Reason:</strong> ${record.rejectionReason || record.comments}</p>
                    ` : ''}
                </div>
            ` : ''}
        `;

        // Attach event listeners
        document.getElementById('btn-back').addEventListener('click', () => this.backToList());

        if (isPending) {
            document.getElementById('btn-approve').addEventListener('click', () => this.approveRecord());
            document.getElementById('btn-reject').addEventListener('click', () => this.rejectRecord());
        }
    }

    /**
     * Render the full page (list view)
     */
    render() {
        if (this.viewMode === 'detail' && this.selectedRecord) {
            this.renderDetailView();
            return;
        }

        this.container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Quality Control</h1>
                    <p class="page-subtitle">Review and approve incoming materials</p>
                </div>
                <button class="btn btn-primary" id="btn-new-qc">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New QC Record
                </button>
            </div>

            <div class="card">
                <div class="card-body" id="qc-table">
                    <!-- Table will be rendered here -->
                </div>
            </div>
        `;

        // Attach event listeners
        document.getElementById('btn-new-qc').addEventListener('click', () => {
            this.showCreateModal();
        });
    }
}

export default QualityControlPage;
