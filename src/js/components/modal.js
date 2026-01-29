/**
 * Modal Component
 * Reusable modal dialog for forms and confirmations
 */

export class Modal {
    constructor() {
        this.container = document.getElementById('modal-container');
        this.isOpen = false;
        this.onSubmit = null;
        this.onClose = null;
    }

    /**
     * Open a modal with content
     * @param {Object} options - Modal options
     */
    open(options = {}) {
        const {
            title = 'Modal',
            content = '',
            footer = null,
            size = 'default',
            onSubmit = null,
            onClose = null,
        } = options;

        this.onSubmit = onSubmit;
        this.onClose = onClose;

        const sizeClass = size === 'large' ? 'style="max-width: 700px"' : '';

        const html = `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal" ${sizeClass}>
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${
                        footer !== null
                            ? `<div class="modal-footer">${footer}</div>`
                            : ''
                    }
                </div>
            </div>
        `;

        this.container.innerHTML = html;

        // Trigger animation
        requestAnimationFrame(() => {
            const overlay = document.getElementById('modal-overlay');
            overlay.classList.add('active');
        });

        this.isOpen = true;
        this.attachEventListeners();

        // Focus first input if exists
        const firstInput = this.container.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    /**
     * Close the modal
     */
    close() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                this.container.innerHTML = '';
                this.isOpen = false;
                if (this.onClose) {
                    this.onClose();
                }
            }, 200);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Click outside to close
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', this.handleEscape);

        // Form submission
        const form = this.container.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.onSubmit) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    this.onSubmit(data, form);
                }
            });
        }

        // Cancel button
        const cancelBtn = this.container.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Handle escape key
     */
    handleEscape = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
            this.close();
            document.removeEventListener('keydown', this.handleEscape);
        }
    };

    /**
     * Show loading state in modal
     */
    setLoading(loading) {
        const submitBtn = this.container.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.innerHTML = loading
                ? '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Saving...'
                : submitBtn.dataset.originalText || 'Save';

            if (!loading && !submitBtn.dataset.originalText) {
                submitBtn.dataset.originalText = submitBtn.innerHTML;
            }
        }
    }

    /**
     * Show form validation errors
     */
    showErrors(errors) {
        // Clear previous errors
        this.container.querySelectorAll('.form-error').forEach((el) => el.remove());
        this.container.querySelectorAll('.form-control.error').forEach((el) => {
            el.classList.remove('error');
        });

        // Show new errors
        Object.entries(errors).forEach(([field, message]) => {
            const input = this.container.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('error');
                const errorEl = document.createElement('div');
                errorEl.className = 'form-error';
                errorEl.textContent = message;
                input.parentNode.appendChild(errorEl);
            }
        });
    }

    /**
     * Static method for confirmation dialogs
     */
    static confirm(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                confirmClass = 'btn-danger',
            } = options;

            const modal = new Modal();

            modal.open({
                title,
                content: `<p>${message}</p>`,
                footer: `
                    <button type="button" class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button type="button" class="btn ${confirmClass}" id="confirm-btn">${confirmText}</button>
                `,
                onClose: () => resolve(false),
            });

            const confirmBtn = document.getElementById('confirm-btn');
            confirmBtn.addEventListener('click', () => {
                modal.close();
                resolve(true);
            });
        });
    }
}

/**
 * Generate form HTML from field definitions
 */
export function generateFormFields(fields, data = {}) {
    return fields
        .map((field) => {
            const value = data[field.name] !== undefined ? data[field.name] : field.default || '';
            const required = field.required ? 'required' : '';
            const readonly = field.readonly ? 'readonly' : '';
            const disabled = field.disabled ? 'disabled' : '';

            let input = '';

            switch (field.type) {
                case 'select':
                    input = `
                        <select class="form-control form-select" name="${field.name}"
                                ${required} ${disabled}>
                            <option value="">Select ${field.label}</option>
                            ${field.options
                                .map(
                                    (opt) => `
                                <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                                    ${opt.label}
                                </option>
                            `
                                )
                                .join('')}
                        </select>
                    `;
                    break;

                case 'textarea':
                    input = `
                        <textarea class="form-control" name="${field.name}"
                                  rows="${field.rows || 3}" ${required} ${readonly}>${value}</textarea>
                    `;
                    break;

                case 'number':
                    input = `
                        <input type="number" class="form-control" name="${field.name}"
                               value="${value}" ${required} ${readonly}
                               ${field.min !== undefined ? `min="${field.min}"` : ''}
                               ${field.max !== undefined ? `max="${field.max}"` : ''}
                               ${field.step !== undefined ? `step="${field.step}"` : ''}>
                    `;
                    break;

                default:
                    input = `
                        <input type="${field.type || 'text'}" class="form-control"
                               name="${field.name}" value="${value}" ${required} ${readonly}>
                    `;
            }

            return `
                <div class="form-group">
                    <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
                    ${input}
                </div>
            `;
        })
        .join('');
}

export default Modal;
