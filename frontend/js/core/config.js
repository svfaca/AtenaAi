export function getAPIBaseURL() {
    const { hostname } = window.location;

    const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.");

    // Produção centralizada no backend público
    return isLocal
        ? "http://127.0.0.1:8000"
        : "https://atenaai-api.onrender.com";
}

export const API_BASE_URL = getAPIBaseURL();
export const API_V1_URL = `${API_BASE_URL}/api/v1`;
