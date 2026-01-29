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
                        id: 'inventories',
                        label: 'Inventories',
                        icon: this.getIcon('inventory'),
                        route: '/inventories',
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
            inventory: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>`,
            qc: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
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
                    <div class="sidebar-logo-icon">E</div>
                    <span>ERP System</span>
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
                            <div class="nav-item ${currentRoute.startsWith(item.route) ? 'active' : ''}"
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
            if (currentRoute.startsWith(route)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

export default Sidebar;
