/**
 * API Configuration
 * Toggle between real API and mock mode for development
 */

// Set to false to use real API, true for mock data
export const USE_MOCK_API = false;

// Base URL for the real API
// IMPORTANT: Change the port to match your API server
// Check your launchSettings.json or console output when running: dotnet run --project H_M_S/H_M_S.csproj
// Example ports: 5000 (HTTP), 5001 (HTTPS), 7000, 7001, etc.
export const API_BASE_URL = 'http://localhost:5000/api';

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

/**
 * Default fetch options
 */
export const defaultFetchOptions = {
    headers: {
        'Content-Type': 'application/json',
    },
    mode: 'cors',
};

/**
 * Handle API response
 */
export async function handleResponse(response) {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const error = await response.json();
            errorMessage = error.message || error.title || error.errors
                ? JSON.stringify(error.errors)
                : errorMessage;
        } catch (e) {
            // Response is not JSON
        }
        throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return { success: true };
    }

    return response.json();
}

/**
 * Make a fetch request with default options
 */
export async function apiFetch(url, options = {}) {
    const fetchOptions = {
        ...defaultFetchOptions,
        ...options,
        headers: {
            ...defaultFetchOptions.headers,
            ...options.headers,
        },
    };

    const response = await fetch(url, fetchOptions);
    return handleResponse(response);
}
