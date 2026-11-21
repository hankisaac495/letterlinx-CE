/** Prototype password gate settings (front-end deterrent only; see SiteGate). */
export const ACCESS_COOKIE = "llce_access";
/** SHA-256 of the demo password (the password itself is not in the code). */
export const PASSWORD_SHA256 = "e75e1f000722624e4dbb58ef8383787f1744bfd68e89cb07bf1a1a28d94c052c";

/**
 * Runs before the page paints: marks <html data-access="1"> when the visitor already
 * has access, so the server-rendered gate is hidden immediately (no flash).
 */
export const ACCESS_PRECHECK_SCRIPT = `try{if(document.cookie.split("; ").indexOf("${ACCESS_COOKIE}=${PASSWORD_SHA256}")>-1)document.documentElement.setAttribute("data-access","1")}catch(e){}`;
