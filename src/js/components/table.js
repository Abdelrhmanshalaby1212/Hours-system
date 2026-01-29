/**
 * Table Component
 * Reusable data table with actions support
 */

export class Table {
    /**
     * @param {Object} options - Table configuration
     * @param {Array} options.columns - Column definitions
     * @param {Array} options.data - Table data
     * @param {Function} options.onAction - Action handler callback
     * @param {boolean} options.loading - Loading state
     * @param {string} options.emptyMessage - Message when no data
     */
    constructor(options = {}) {
        this.columns = options.columns || [];
        this.data = options.data || [];
        this.onAction = options.onAction || (() => {});
        this.loading = options.loading || false;
        this.emptyMessage = options.emptyMessage || 'No data available';
        this.emptyIcon = options.emptyIcon || '📋';
    }

    /**
     * Update table data
     */
    setData(data) {
        this.data = data;
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.loading = loading;
    }

    /**
     * Render a cell value based on column type
     */
    renderCell(column, row) {
        const value = row[column.key];

        // Custom render function
        if (column.render) {
            return column.render(value, row);
        }

        // Badge/Status column
        if (column.type === 'badge') {
            const badgeClass = column.getBadgeClass
                ? column.getBadgeClass(value)
                : 'badge-secondary';
            return `<span class="badge ${badgeClass}">${value}</span>`;
        }

        // Actions column
        if (column.type === 'actions') {
            return this.renderActions(column.actions, row);
        }

        // Default text
        return value !== undefined && value !== null ? value : '-';
    }

    /**
     * Render action buttons
     */
    renderActions(actions, row) {
        return `
            <div class="table-actions">
                ${actions
                    .map((action) => {
                        const isDisabled = action.isDisabled ? action.isDisabled(row) : false;
                        const buttonClass = action.class || 'btn-secondary';
                        const title = action.title || action.label;

                        return `
                            <button class="btn btn-sm ${buttonClass} btn-icon"
                                    data-action="${action.id}"
                                    data-id="${row.id}"
                                    title="${title}"
                                    ${isDisabled ? 'disabled' : ''}>
                                ${action.icon || action.label}
                            </button>
                        `;
                    })
                    .join('')}
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${this.emptyIcon}</div>
                <div class="empty-state-title">No Records Found</div>
                <div class="empty-state-description">${this.emptyMessage}</div>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div class="loading-text">
                <div class="spinner" style="margin: 0 auto 16px;"></div>
                <p>Loading data...</p>
            </div>
        `;
    }

    /**
     * Render the complete table
     */
    render() {
        if (this.loading) {
            return this.renderLoading();
        }

        if (!this.data || this.data.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            ${this.columns
                                .map(
                                    (col) => `
                                <th style="${col.width ? `width: ${col.width}` : ''}">${col.label}</th>
                            `
                                )
                                .join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data
                            .map(
                                (row) => `
                            <tr data-id="${row.id}">
                                ${this.columns
                                    .map(
                                        (col) => `
                                    <td>${this.renderCell(col, row)}</td>
                                `
                                    )
                                    .join('')}
                            </tr>
                        `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Attach event listeners after render
     * @param {HTMLElement} container - The container element
     */
    attachEventListeners(container) {
        const actionButtons = container.querySelectorAll('[data-action]');
        actionButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                const id = button.dataset.id;
                const row = this.data.find((r) => String(r.id) === String(id));
                this.onAction(action, row);
            });
        });
    }
}

/**
 * Table action icons
 */
export const TableIcons = {
    view: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`,
    delete: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`,
    x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,
};

export default Table;
