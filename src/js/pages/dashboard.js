/**
 * Dashboard Page
 * Landing page with summary stats, utilization overview, and quick actions
 */

import { InventoriesAPI } from '../api/inventories.js';
import { RawMaterialsAPI } from '../api/rawMaterials.js';
import { showToast } from '../app.js';

export class DashboardPage {
    constructor(router) {
        this.router = router;
        this.container = document.getElementById('page-content');
        this.inventories = [];
        this.rawMaterials = [];
        this.loading = true;
    }

    async init() {
        this.render();
        await this.loadData();
        this.loading = false;
        this.render();
    }

    async loadData() {
        try {
            const [inventories, rawMaterials] = await Promise.all([
                InventoriesAPI.getAll(),
                RawMaterialsAPI.getAll(),
            ]);
            this.inventories = inventories || [];
            this.rawMaterials = rawMaterials || [];
        } catch (error) {
            showToast('Failed to load dashboard data: ' + error.message, 'error');
        }
    }

    get totalInventories() { return this.inventories.length; }
    get activeInventories() { return this.inventories.filter(i => i.isActive).length; }
    get inactiveInventories() { return this.inventories.filter(i => !i.isActive).length; }
    get totalRawMaterials() { return this.rawMaterials.length; }
    get totalCapacity() { return this.inventories.reduce((s, i) => s + (i.capacity || 0), 0); }
    get totalUtilization() { return this.inventories.reduce((s, i) => s + (i.currentUtilization || 0), 0); }
    get utilizationPercent() {
        return this.totalCapacity > 0
            ? Math.round((this.totalUtilization / this.totalCapacity) * 100)
            : 0;
    }

    renderStatCards() {
        const stats = [
            {
                label: 'Total Inventories',
                value: this.totalInventories,
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>`,
                color: 'var(--primary-color)',
                bg: 'rgba(37, 99, 235, 0.1)',
            },
            {
                label: 'Active Warehouses',
                value: this.activeInventories,
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
                color: 'var(--success-color)',
                bg: 'rgba(34, 197, 94, 0.1)',
            },
            {
                label: 'Raw Materials',
                value: this.totalRawMaterials,
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
                color: 'var(--warning-color)',
                bg: 'rgba(245, 158, 11, 0.1)',
            },
            {
                label: 'Overall Utilization',
                value: `${this.utilizationPercent}%`,
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
                color: 'var(--info-color)',
                bg: 'rgba(59, 130, 246, 0.1)',
            },
        ];

        return `
            <div class="dashboard-stats">
                ${stats.map(s => `
                    <div class="dashboard-stat-card">
                        <div class="stat-icon" style="background-color: ${s.bg}; color: ${s.color};">${s.icon}</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.loading ? '--' : s.value}</div>
                            <div class="stat-label">${s.label}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderUtilizationOverview() {
        const sorted = [...this.inventories]
            .filter(i => i.capacity > 0)
            .sort((a, b) => (b.currentUtilization / b.capacity) - (a.currentUtilization / a.capacity));

        const rows = sorted.map(inv => {
            const pct = Math.round((inv.currentUtilization / inv.capacity) * 100);
            const barColor = pct > 80 ? 'var(--danger-color)' : pct > 50 ? 'var(--warning-color)' : 'var(--success-color)';
            return `
                <div class="utilization-row">
                    <div class="utilization-info">
                        <span class="utilization-name">${inv.name}</span>
                        <span class="utilization-detail">${inv.currentUtilization.toLocaleString()} / ${inv.capacity.toLocaleString()}</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
                    </div>
                    <span class="utilization-pct">${pct}%</span>
                </div>
            `;
        }).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Inventory Utilization</h3>
                </div>
                <div class="card-body">
                    ${this.loading
                        ? '<div class="loading-text"><div class="spinner" style="margin: 20px auto;"></div></div>'
                        : (sorted.length ? rows : '<div class="text-muted" style="text-align:center; padding:20px;">No inventory data available.</div>')
                    }
                </div>
            </div>
        `;
    }

    renderInventoriesTable() {
        const items = this.inventories.slice(0, 5);
        const rows = items.map(inv => {
            const badgeClass = inv.isActive ? 'badge-success' : 'badge-secondary';
            const statusText = inv.isActive ? 'Active' : 'Inactive';
            return `
                <tr class="dashboard-row-clickable" data-route="/inventories/${inv.id}">
                    <td><strong>${inv.code || '-'}</strong></td>
                    <td>${inv.name}</td>
                    <td>${inv.location || '-'}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Inventories</h3>
                    <button class="btn btn-sm btn-secondary" id="btn-view-all-inv">View All</button>
                </div>
                <div class="card-body" style="padding:0;">
                    ${this.loading
                        ? '<div class="loading-text"><div class="spinner" style="margin: 20px auto;"></div></div>'
                        : `<table class="table">
                            <thead><tr>
                                <th>Code</th><th>Name</th><th>Location</th><th>Status</th>
                            </tr></thead>
                            <tbody>${rows || '<tr><td colspan="4" style="text-align:center; padding:20px;" class="text-muted">No inventories found</td></tr>'}</tbody>
                        </table>`
                    }
                </div>
            </div>
        `;
    }

    renderQuickActions() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quick Actions</h3>
                </div>
                <div class="card-body">
                    <div class="quick-actions">
                        <button class="quick-action-btn" id="qa-add-inventory">
                            <div class="qa-icon" style="background-color: rgba(37, 99, 235, 0.1); color: var(--primary-color);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                            <div class="qa-text">
                                <div class="qa-title">Add Inventory</div>
                                <div class="qa-desc">Create a new warehouse</div>
                            </div>
                        </button>
                        <button class="quick-action-btn" id="qa-new-qc">
                            <div class="qa-icon" style="background-color: rgba(34, 197, 94, 0.1); color: var(--success-color);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                            </div>
                            <div class="qa-text">
                                <div class="qa-title">New QC Record</div>
                                <div class="qa-desc">Register incoming delivery</div>
                            </div>
                        </button>
                        <button class="quick-action-btn" id="qa-view-materials">
                            <div class="qa-icon" style="background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                            <div class="qa-text">
                                <div class="qa-title">Raw Materials</div>
                                <div class="qa-desc">View material catalog</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSummaryCard() {
        const usedPct = this.utilizationPercent;
        const freePct = 100 - usedPct;
        const freeCapacity = this.totalCapacity - this.totalUtilization;

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Storage Summary</h3>
                </div>
                <div class="card-body">
                    ${this.loading
                        ? '<div class="loading-text"><div class="spinner" style="margin: 20px auto;"></div></div>'
                        : `
                    <div class="summary-items">
                        <div class="summary-item">
                            <div class="summary-dot" style="background: var(--primary-color);"></div>
                            <span class="summary-label">Total Capacity</span>
                            <span class="summary-value">${this.totalCapacity.toLocaleString()}</span>
                        </div>
                        <div class="summary-item">
                            <div class="summary-dot" style="background: var(--warning-color);"></div>
                            <span class="summary-label">Used</span>
                            <span class="summary-value">${this.totalUtilization.toLocaleString()} (${usedPct}%)</span>
                        </div>
                        <div class="summary-item">
                            <div class="summary-dot" style="background: var(--success-color);"></div>
                            <span class="summary-label">Available</span>
                            <span class="summary-value">${freeCapacity.toLocaleString()} (${freePct}%)</span>
                        </div>
                        <div class="summary-item">
                            <div class="summary-dot" style="background: var(--danger-color);"></div>
                            <span class="summary-label">Inactive</span>
                            <span class="summary-value">${this.inactiveInventories} warehouse${this.inactiveInventories !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    `}
                </div>
            </div>
        `;
    }

    render() {
        this.container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle">Horus Management System Overview</p>
                </div>
            </div>

            ${this.renderStatCards()}

            <div class="dashboard-grid">
                <div class="dashboard-col-main">
                    ${this.renderUtilizationOverview()}
                    ${this.renderInventoriesTable()}
                </div>
                <div class="dashboard-col-side">
                    ${this.renderQuickActions()}
                    ${this.renderSummaryCard()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        document.getElementById('qa-add-inventory')?.addEventListener('click', () => {
            this.router.navigate('/inventories');
        });
        document.getElementById('qa-new-qc')?.addEventListener('click', () => {
            this.router.navigate('/quality-control');
        });
        document.getElementById('qa-view-materials')?.addEventListener('click', () => {
            this.router.navigate('/inventories');
        });
        document.getElementById('btn-view-all-inv')?.addEventListener('click', () => {
            this.router.navigate('/inventories');
        });

        document.querySelectorAll('.dashboard-row-clickable').forEach(row => {
            row.addEventListener('click', () => {
                this.router.navigate(row.dataset.route);
            });
        });
    }
}

export default DashboardPage;
