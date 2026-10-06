/**
 * TundaGula — Error Handler
 *
 * Converts raw API errors (nested objects, field arrays, network failures)
 * into clean, human-friendly strings suitable for toast display.
 *
 * Usage:
 *   import { formatApiError } from "../utils/errorHandler";
 *   catch (err) { say(formatApiError(err)); }
 */

/** Field-label prettifier – strips underscores and capitalises. */
function prettifyField(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Extracts a single readable message from any error shape the backend can produce.
 *
 * Handles:
 *  - `{ data: { phone: ["This field is required."] } }`
 *  - `{ data: { error: "Invalid token" } }`
 *  - `{ data: { detail: "Not found." } }`
 *  - `{ message: "Network request failed" }`
 *  - Plain `Error("something")`
 */
export function formatApiError(err: any): string {
  // Network / connection failures
  if (!err) return "Something went wrong. Please try again.";

  if (typeof err === "string") return err;

  // DRF structured error body
  const data = err.data || err.response?.data;
  if (data && typeof data === "object") {
    // { detail: "..." }
    if (typeof data.detail === "string") return data.detail;

    // { error: "..." }
    if (typeof data.error === "string") return data.error;

    // { non_field_errors: ["..."] }
    if (Array.isArray(data.non_field_errors)) return data.non_field_errors[0];

    // Field-level errors: { phone: ["This field is required."] }
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      const msg = Array.isArray(val) ? val[0] : String(val);
      return `${prettifyField(firstKey)}: ${msg}`;
    }
  }

  // Standard Error
  if (err.message) {
    // Make common fetch errors friendlier
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      return "Could not reach the server. Check your internet connection.";
    }
    if (err.message === "Unauthorized") {
      return "Your session has expired. Please log in again.";
    }
    return err.message;
  }

  return "Something went wrong. Please try again.";
}
