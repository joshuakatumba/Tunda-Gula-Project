export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────
  login: "/accounts/login/",
  google: "/accounts/google/",
  register: "/accounts/register/",
  requestOtp: "/accounts/otp/request/",
  verifyOtp: "/accounts/otp/verify/",
  me: "/accounts/me/",
  // ── Session management ────────────────────────────────────────────
  refreshToken: "/accounts/token/refresh/",
  logout: "/accounts/logout/",
  logoutAll: "/accounts/logout-all/",
  // ── Listings ─────────────────────────────────────────────────────
  listings: "/listings/",
  listing: (id) => `/listings/${id}/`,
  plans: "/listings/plans/",
  plan: (id) => `/listings/plans/${id}/`,
  sellerDashboard: "/listings/seller/dashboard/",
  sellerAnalytics: "/listings/seller/analytics/",
  expenses: "/listings/expenses/",
  expense: (id) => `/listings/expenses/${id}/`,
  // ── Orders ───────────────────────────────────────────────────────
  orders: "/orders/",
  order: (id) => `/orders/${id}/`,
  orderAccept: (id) => `/orders/${id}/accept/`,
  orderDispatch: (id) => `/orders/${id}/dispatch/`,
  orderDeliver: (id) => `/orders/${id}/deliver/`,
  orderRate: (id) => `/orders/${id}/rate/`,
  preorder: "/orders/preorder/",
  batchCheckout: "/orders/batch-checkout/",
  subscriptions: "/orders/subscriptions/",
  ratings: "/orders/ratings/",
  ratingsSummary: "/orders/ratings/summary/",
  // ── Payments ─────────────────────────────────────────────────────
  initiate: "/payments/initiate/",
  payouts: "/payments/payouts/",
  settings: "/payments/settings/",
  // ── Disputes ─────────────────────────────────────────────────────
  disputes: "/disputes/",
  dispute: (id) => `/disputes/${id}/`,
  disputeResolve: (id) => `/disputes/${id}/resolve/`,
  // ── Market data ──────────────────────────────────────────────────
  prices: "/market/prices/",
  predictions: "/market/predictions/",
  categories: "/market/categories/",
  // ── Admin ────────────────────────────────────────────────────────
  adminStats: "/accounts/admin/stats/",
  pending: "/accounts/pending/",
  approve: (id) => `/accounts/${id}/approve/`,
  reject: (id) => `/accounts/${id}/reject/`,
  toggleActive: (id) => `/accounts/${id}/toggle-active/`,
  // ── Admin reports ────────────────────────────────────────────────
  reportTransactions: "/payments/reports/transactions/",
  reportTransactionsCsv: "/payments/reports/transactions.csv",
  reportUsers: "/payments/reports/users/",
  reportUsersCsv: "/payments/reports/users.csv",
  reportGmvCsv: "/payments/reports/gmv.csv",
  reportDelivery: "/payments/reports/delivery/",
  category: (id) => `/market/categories/${id}/`
};
