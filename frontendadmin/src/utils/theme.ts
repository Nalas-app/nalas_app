/**
 * 🎨 THEME COLORS — Change these to customize the entire admin app
 *
 * Primary: used for sidebar, login background, buttons, accents
 * Accent:  used for hover states, active nav items, highlights
 */

const theme = {
    // ─── Background gradients ─────────────────────────────────────────────────
    /** Login page background gradient (start → end) */
    loginBgFrom: "#FFF3E0",
    loginBgVia: "#FFF3E0",
    loginBgTo: "#FFF3E0",

    /** Sidebar background gradient (top → bottom) */
    sidebarBgFrom: "#1B5E20",
    sidebarBgTo: "#388E3C",

    // ─── Accent / brand colors ────────────────────────────────────────────────
    /** Primary brand color (buttons, active nav, logo circle) */
    primary: "#689F38",

    /** Darker shade of primary (button hover, gradient end) */
    primaryDark: "#558B2F",

    /** Soft version of primary used for text on dark backgrounds */
    primarySoft: "#8BC34A",

    // ─── Surface colors ───────────────────────────────────────────────────────
    /** Main content area background */
    contentBg: "#f5f0eb",

    /** Header background */
    headerBg: "#ffffff",

    /** Page title color */
    pageTitleColor: "#1a0a00",

    /** Header border and subtle dividers */
    borderColor: "#e8ddd4",

    /** Secondary text (breadcrumb / subtitle) */
    subtitleColor: "#9b7060",
};

export default theme;
