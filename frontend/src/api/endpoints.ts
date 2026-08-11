/**
 * TundaGula — API Endpoints
 *
 * Centralized URL map for all backend routes.
 * Keeps every fetch call DRY — change a path here, not in 12 components.
 */

export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────
  register:       "/accounts/register/",
  requestOtp:     "/accounts/otp/request/",
  verifyOtp:      "/accounts/otp/verify/",
  me:             "/accounts/me/",

  // ── Listings ─────────────────────────────────────────────────────
  listings:       "/listings/",
  listing:        (id: number | string) => `/listings/${id}/`,
  plans:          "/listings/plans/",

  // ── Orders ───────────────────────────────────────────────────────
  orders:         "/orders/",
  order:          (id: number | string) => `/orders/${id}/`,
  orderAccept:    (id: number | string) => `/orders/${id}/accept/`,
  orderDeliver:   (id: number | string) => `/orders/${id}/deliver/`,
  orderRate:      (id: number | string) => `/orders/${id}/rate/`,
  preorder:       "/orders/preorder/",

  // ── Payments ─────────────────────────────────────────────────────
  initiate:       "/payments/initiate/",
  payouts:        "/payments/payouts/",
  settings:       "/payments/settings/",

  // ── Disputes ─────────────────────────────────────────────────────
  disputes:       "/disputes/",
  dispute:        (id: number | string) => `/disputes/${id}/`,
  disputeResolve: (id: number | string) => `/disputes/${id}/resolve/`,

  // ── Market data ──────────────────────────────────────────────────
  prices:         "/market/prices/",
  categories:     "/market/categories/",

  // ── Admin ────────────────────────────────────────────────────────
  pending:        "/accounts/pending/",
  approve:        (id: number | string) => `/accounts/${id}/approve/`,
  reject:         (id: number | string) => `/accounts/${id}/reject/`,
};
