const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
};

export function getAccessTokenFromCookie() {
  return getCookieValue("access_token");
}

export function getUserRoleFromCookie() {
  return getCookieValue("role");
}
