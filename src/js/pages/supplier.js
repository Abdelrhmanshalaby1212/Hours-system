/**
 * Supplier Page
 * Upload invoice PDFs for quality control review
 */

import { QualityControlAPI } from '../api/qualityControl.js';
import { RawMaterialsAPI } from '../api/rawMaterials.js';
import { showToast } from '../app.js';

export class SupplierPage {
    constructor(router) {
        this.router = router;
        this.container = document.getElementById('page-content');
        this.rawMaterials = [];
        this.loading = true;
        this.submitting = false;
    }

    async init() {
        this.render();
        await this.loadRawMaterials();
        this.loading = false;
        this.render();
    }

    async loadRawMaterials() {
        try {
            this.rawMaterials = await RawMaterialsAPI.getAll();
        } catch (error) {
            showToast('Failed to load raw materials: ' + error.message, 'error');
            this.rawMaterials = [];
        }
    }

    generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const ts = Date.now().toString().slice(-6);
        return `PINV-${year}-${ts}`;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.submitting) return;

        const form = e.target;
        const fileInput = form.querySelector('input[name="InvoicePdf"]');
        const file = fileInput?.files[0];

        if (!file) {
            showToast('Please select a PDF file', 'warning');
            return;
        }

        if (file.type !== 'application/pdf') {
            showToast('Only PDF files are allowed', 'warning');
            return;
        }

        this.submitting = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="spinner" style="width:16px;height:16px;border-width:2px;margin-right:8px;"></div>
            Submitting...
        `;

        try {
            const formData = new FormData();
            formData.append('PurchaseInvoiceNumber', this.generateInvoiceNumber());
            formData.append('RawMaterialId', form.querySelector('select[name="RawMaterialId"]').value);
            formData.append('Quantity', form.querySelector('input[name="Quantity"]').value);
            formData.append('InvoicePdf', file);

            await QualityControlAPI.createWithInvoice(formData);

            showToast('Invoice submitted successfully! It will be reviewed by the QC team.', 'success');
            form.reset();
            this.renderDropZone();
        } catch (error) {
            showToast('Failed to submit: ' + error.message, 'error');
        }

        this.submitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Submit to Quality Control
        `;
    }

    renderDropZone() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        dropZone.innerHTML = `
            <div class="drop-zone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="12" y2="12"></line>
                    <line x1="15" y1="15" x2="12" y2="12"></line>
                </svg>
                <p class="drop-zone-text">Drag & drop your invoice PDF here</p>
                <p class="drop-zone-hint">or click to browse files</p>
                <input type="file" name="InvoicePdf" accept=".pdf" class="drop-zone-input" required>
            </div>
        `;

        this.attachDropZoneListeners(dropZone);
    }

    attachDropZoneListeners(dropZone) {
        const fileInput = dropZone.querySelector('.drop-zone-input');

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drop-zone-active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drop-zone-active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drop-zone-active');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                fileInput.files = e.dataTransfer.files;
                this.showFileSelected(dropZone, file);
            } else {
                showToast('Only PDF files are allowed', 'warning');
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) {
                this.showFileSelected(dropZone, fileInput.files[0]);
            }
        });
    }

    showFileSelected(dropZone, file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        dropZone.querySelector('.drop-zone-content').innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <polyline points="9 15 12 18 15 15"></polyline>
                <line x1="12" y1="12" x2="12" y2="18"></line>
            </svg>
            <p class="drop-zone-text" style="color: var(--success-color);">${file.name}</p>
            <p class="drop-zone-hint">${sizeMB} MB - Click to change file</p>
            <input type="file" name="InvoicePdf" accept=".pdf" class="drop-zone-input" required>
        `;

        // Re-set the file on the new input
        const newInput = dropZone.querySelector('.drop-zone-input');
        const dt = new DataTransfer();
        dt.items.add(file);
        newInput.files = dt.files;

        // Re-attach listeners for the new input
        dropZone.addEventListener('click', () => newInput.click());
        newInput.addEventListener('change', () => {
            if (newInput.files[0]) {
                this.showFileSelected(dropZone, newInput.files[0]);
            }
        });
    }

    render() {
        const materialOptions = this.rawMaterials.map(m =>
            `<option value="${m.id}">${m.name || `Material ${m.id}`}</option>`
        ).join('');

        this.container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Supplier Portal</h1>
                    <p class="page-subtitle">Upload invoices for quality control review</p>
                </div>
            </div>

            <div class="supplier-layout">
                <div class="card supplier-form-card">
                    <div class="card-header">
                        <h3 class="card-title">Upload Invoice</h3>
                    </div>
                    <div class="card-body">
                        ${this.loading
                            ? '<div class="loading-text"><div class="spinner" style="margin: 40px auto;"></div></div>'
                            : this.rawMaterials.length === 0
                                ? `<div class="empty-state">
                                    <div class="empty-state-icon">📦</div>
                                    <div class="empty-state-title">No Raw Materials</div>
                                    <div class="empty-state-description">Raw materials must be created before submitting invoices.</div>
                                  </div>`
                                : `
                        <form id="supplier-form" enctype="multipart/form-data">
                            <div class="form-group">
                                <label class="form-label required">Raw Material</label>
                                <select class="form-control form-select" name="RawMaterialId" required>
                                    <option value="">Select a raw material...</option>
                                    ${materialOptions}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label required">Quantity</label>
                                <input type="number" class="form-control" name="Quantity"
                                       min="0.01" step="0.01" required placeholder="Enter quantity">
                            </div>

                            <div class="form-group">
                                <label class="form-label required">Invoice PDF</label>
                                <div class="drop-zone" id="drop-zone">
                                    <div class="drop-zone-content">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="12" y1="18" x2="12" y2="12"></line>
                                            <line x1="9" y1="15" x2="12" y2="12"></line>
                                            <line x1="15" y1="15" x2="12" y2="12"></line>
                                        </svg>
                                        <p class="drop-zone-text">Drag & drop your invoice PDF here</p>
                                        <p class="drop-zone-hint">or click to browse files</p>
                                        <input type="file" name="InvoicePdf" accept=".pdf" class="drop-zone-input" required>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary" style="width:100%; padding: 14px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                                Submit to Quality Control
                            </button>
                        </form>
                        `}
                    </div>
                </div>

                <div class="supplier-info-card">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">How it works</h3>
                        </div>
                        <div class="card-body">
                            <div class="supplier-steps">
                                <div class="supplier-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <div class="step-title">Select Material</div>
                                        <div class="step-desc">Choose the raw material for this delivery</div>
                                    </div>
                                </div>
                                <div class="supplier-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <div class="step-title">Enter Quantity</div>
                                        <div class="step-desc">Specify the delivered amount</div>
                                    </div>
                                </div>
                                <div class="supplier-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <div class="step-title">Upload Invoice</div>
                                        <div class="step-desc">Attach the invoice PDF document</div>
                                    </div>
                                </div>
                                <div class="supplier-step">
                                    <div class="step-number">4</div>
                                    <div class="step-content">
                                        <div class="step-title">QC Review</div>
                                        <div class="step-desc">The QC team will review and approve</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!this.loading && this.rawMaterials.length > 0) {
            const form = document.getElementById('supplier-form');
            form.addEventListener('submit', (e) => this.handleSubmit(e));

            const dropZone = document.getElementById('drop-zone');
            this.attachDropZoneListeners(dropZone);
        }
    }
}

export default SupplierPage;
