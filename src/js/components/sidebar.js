/**
 * Sidebar Component
 * Handles navigation sidebar rendering and interactions
 */

export class Sidebar {
    constructor(containerId, router) {
        this.container = document.getElementById(containerId);
        this.router = router;
        this.navItems = [
            {
                section: 'Main Menu',
                items: [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: this.getIcon('dashboard'),
                        route: '/',
                    },
                    {
                        id: 'inventories',
                        label: 'Inventories',
                        icon: this.getIcon('inventory'),
                        route: '/inventories',
                    },
                    {
                        id: 'supplier',
                        label: 'Supplier',
                        icon: this.getIcon('supplier'),
                        route: '/supplier',
                    },
                    {
                        id: 'quality-control',
                        label: 'Quality Control',
                        icon: this.getIcon('qc'),
                        route: '/quality-control',
                    },
                ],
            },
        ];
    }

    /**
     * Get SVG icon for navigation items
     */
    getIcon(type) {
        const icons = {
            dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>`,
            inventory: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>`,
            qc: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>`,
            supplier: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="12" y2="12"></line>
                <line x1="15" y1="15" x2="12" y2="12"></line>
            </svg>`,
        };
        return icons[type] || '';
    }

    /**
     * Render the sidebar
     */
    render() {
        const currentRoute = this.router.getCurrentRoute();

        const html = `
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <img src="assets/logo.png" alt="Horus" class="sidebar-logo-img">
                    <div class="sidebar-logo-text">
                        <span class="sidebar-brand">HORUS</span>
                        <span class="sidebar-brand-sub">Management System</span>
                    </div>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${this.navItems
                    .map(
                        (section) => `
                    <div class="nav-section">
                        <div class="nav-section-title">${section.section}</div>
                        ${section.items
                            .map(
                                (item) => `
                            <div class="nav-item ${(item.route === '/' ? (currentRoute === '/' || currentRoute === '/dashboard') : currentRoute.startsWith(item.route)) ? 'active' : ''}"
                                 data-route="${item.route}">
                                <span class="nav-item-icon">${item.icon}</span>
                                <span>${item.label}</span>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                `
                    )
                    .join('')}
            </nav>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Attach click event listeners to nav items
     */
    attachEventListeners() {
        const navItems = this.container.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                this.router.navigate(route);
            });
        });
    }

    /**
     * Update active state when route changes
     */
    updateActiveState() {
        const currentRoute = this.router.getCurrentRoute();
        const navItems = this.container.querySelectorAll('.nav-item');

        navItems.forEach((item) => {
            const route = item.dataset.route;
            const isActive = route === '/'
                ? (currentRoute === '/' || currentRoute === '/dashboard')
                : currentRoute.startsWith(route);
            item.classList.toggle('active', isActive);
        });
    }
}

export default Sidebar;
