import { AxiosError } from "axios";

/**
 * Standardized error handler to parse backend validation and server errors.
 * The backend error middleware formats errors as:
 * { success: false, error: { code, message, details } }
 */
export const getErrorMessage = (error: unknown, defaultMessage = "An unexpected error occurred"): string => {
    if (error instanceof AxiosError) {
        // Handle standard backend error structure
        if (error.response?.data?.error?.message) {
            let msg = error.response.data.error.message;
            const details = error.response.data.error.details;
            
            // Append validation details if they exist
            if (details) {
                if (Array.isArray(details)) {
                    msg += `: ${details.map((d: any) => d.message || d).join(", ")}`;
                } else if (typeof details === 'object') {
                    // Backend returns details as { "field": "error message" }
                    msg += `: ${Object.values(details).join(", ")}`;
                }
            }
            return msg;
        }

        // Handle fallback structure just in case
        if (error.response?.data?.message) {
            return error.response.data.message;
        }

        // Network or connection errors
        if (error.message) {
            return error.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return defaultMessage;
};
