/**
 * TundaGula — API Endpoints
 *
 * Centralized URL map for all backend routes.
 * Keeps every fetch call DRY — change a path here, not in 12 components.
 */

export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────
  login:          "/accounts/login/",
  register:       "/accounts/register/",
  requestOtp:     "/accounts/otp/request/",
  verifyOtp:      "/accounts/otp/verify/",
  me:             "/accounts/me/",

  // ── Session management ────────────────────────────────────────────
  refreshToken:   "/accounts/token/refresh/",
  logout:         "/accounts/logout/",
  logoutAll:      "/accounts/logout-all/",

  // ── Listings ─────────────────────────────────────────────────────
  listings:           "/listings/",
  listing:            (id: number | string) => `/listings/${id}/`,
  plans:              "/listings/plans/",
  plan:               (id: number | string) => `/listings/plans/${id}/`,
  sellerDashboard:    "/listings/seller/dashboard/",

  // ── Orders ───────────────────────────────────────────────────────
  orders:         "/orders/",
  order:          (id: number | string) => `/orders/${id}/`,
  orderAccept:    (id: number | string) => `/orders/${id}/accept/`,
  orderDispatch:  (id: number | string) => `/orders/${id}/dispatch/`,
  orderDeliver:   (id: number | string) => `/orders/${id}/deliver/`,
  orderRate:      (id: number | string) => `/orders/${id}/rate/`,
  preorder:       "/orders/preorder/",
  ratings:        "/orders/ratings/",
  ratingsSummary: "/orders/ratings/summary/",

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
  adminStats:     "/accounts/admin/stats/",
  pending:        "/accounts/pending/",
  approve:        (id: number | string) => `/accounts/${id}/approve/`,
  reject:         (id: number | string) => `/accounts/${id}/reject/`,
  toggleActive:   (id: number | string) => `/accounts/${id}/toggle-active/`,

  // ── Admin reports ────────────────────────────────────────────────
  reportTransactions:    "/payments/reports/transactions/",
  reportTransactionsCsv: "/payments/reports/transactions.csv",
  reportUsers:           "/payments/reports/users/",
  reportUsersCsv:        "/payments/reports/users.csv",
  reportGmvCsv:          "/payments/reports/gmv.csv",
  category:              (id: number | string) => `/market/categories/${id}/`,
};
