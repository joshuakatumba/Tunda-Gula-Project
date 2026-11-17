function prettifyField(field) {
  return field.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
export function formatApiError(err) {
  if (!err) return "Something went wrong. Please try again.";
  if (typeof err === "string") return err;
  const data = err.data || err.response?.data;
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (Array.isArray(data.non_field_errors)) return data.non_field_errors[0];
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      const msg = Array.isArray(val) ? val[0] : String(val);
      return `${prettifyField(firstKey)}: ${msg}`;
    }
  }
  if (err.message) {
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
