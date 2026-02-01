/**
 * Router Module
 * Handles SPA routing without page reloads
 */

export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '/';
        this.currentPage = null;
        this.onRouteChange = null;
    }

    /**
     * Register a route handler
     * @param {string} path - Route path (can include :param patterns)
     * @param {Function} handler - Handler function that returns a page instance
     */
    register(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * Initialize the router
     */
    init() {
        // Handle hash changes (back/forward navigation)
        window.addEventListener('hashchange', () => {
            const path = window.location.hash.substring(1) || '/';
            this.handleRoute(path);
        });

        // Handle initial route
        const initialRoute = window.location.hash
            ? window.location.hash.substring(1)
            : '/';

        this.navigate(initialRoute, false);
    }

    /**
     * Navigate to a route
     * @param {string} path - The path to navigate to
     * @param {boolean} addToHistory - Whether to add to browser history
     */
    navigate(path, addToHistory = true) {
        if (addToHistory) {
            window.location.hash = path;
            return; // hashchange event will call handleRoute
        }

        this.handleRoute(path);
    }

    /**
     * Get the current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Parse route and extract parameters
     * @param {string} path - The actual path
     * @param {string} pattern - The route pattern
     * @returns {Object|null} - Extracted params or null if no match
     */
    matchRoute(path, pattern) {
        const pathParts = path.split('/').filter(Boolean);
        const patternParts = pattern.split('/').filter(Boolean);

        if (pathParts.length !== patternParts.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];

            if (patternPart.startsWith(':')) {
                // This is a parameter
                const paramName = patternPart.substring(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                // Static part doesn't match
                return null;
            }
        }

        return params;
    }

    /**
     * Handle route change
     * @param {string} path - The path to handle
     */
    async handleRoute(path) {
        // Clean up path
        path = path.replace(/^#/, '');
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        this.currentRoute = path;

        // Find matching route
        let matchedHandler = null;
        let matchedParams = {};

        for (const pattern of Object.keys(this.routes)) {
            const params = this.matchRoute(path, pattern);
            if (params !== null) {
                matchedHandler = this.routes[pattern];
                matchedParams = params;
                break;
            }
        }

        // Default to inventories if no match
        if (!matchedHandler) {
            this.navigate('/');
            return;
        }

        // Create and initialize the page
        try {
            this.currentPage = matchedHandler(matchedParams);
            if (this.currentPage && typeof this.currentPage.init === 'function') {
                await this.currentPage.init();
            }
        } catch (error) {
            console.error('Error initializing page:', error);
            this.showErrorPage(error);
        }

        // Notify listeners of route change
        if (this.onRouteChange) {
            this.onRouteChange(path);
        }
    }

    /**
     * Show error page
     */
    showErrorPage(error) {
        const container = document.getElementById('page-content');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">Something went wrong</div>
                <div class="empty-state-description">${error.message || 'An unexpected error occurred'}</div>
                <button class="btn btn-primary" onclick="window.location.hash = '/'">
                    Go to Dashboard
                </button>
            </div>
        `;
    }

    /**
     * Set route change callback
     */
    setOnRouteChange(callback) {
        this.onRouteChange = callback;
    }
}

export default Router;
