/**
 * Main Application Entry Point
 * Initializes the ERP Management System
 */

import { Router } from './router.js';
import { Sidebar } from './components/sidebar.js';
import { InventoriesPage } from './pages/inventories.js';
import { InventoryDetailsPage } from './pages/inventoryDetails.js';
import { QualityControlPage } from './pages/qualityControl.js';

// Global toast notification function
let toastTimeout = null;

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${getToastIcon(type)}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ',
    };
    return icons[type] || icons.info;
}

/**
 * Initialize the application
 */
function initApp() {
    // Create router instance
    const router = new Router();

    // Register routes
    router.register('/inventories', () => new InventoriesPage(router));
    router.register('/inventories/:id', (params) => new InventoryDetailsPage(router, params.id));
    router.register('/quality-control', () => new QualityControlPage(router));

    // Create and render sidebar
    const sidebar = new Sidebar('sidebar', router);
    sidebar.render();

    // Update sidebar on route changes
    router.setOnRouteChange(() => {
        sidebar.updateActiveState();
    });

    // Initialize router
    router.init();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
