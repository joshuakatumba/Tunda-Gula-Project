import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";
import { translate } from "../context/I18nContext";
export const ugx = (n) => "UGX " + Math.round(n).toLocaleString("en-UG");
export const TODAY = /* @__PURE__ */ new Date("2026-07-19");
export const daysTo = (d) => Math.round((new Date(d).getTime() - TODAY.getTime()) / 864e5);
export const dshort = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const STATUS_LABEL = {
  placed: "Payment pending",
  accepted: "Order accepted",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  reserved: "Reserved"
};
export const STATUS_TONE = {
  placed: "b-grey",
  accepted: "b-maize",
  out_for_delivery: "b-maize",
  delivered: "b-green",
  reserved: "b-green"
};
export const typeLabel = (id) => {
  if (!id) return "";
  const found = [...SELLER_TYPES, ...BUYER_TYPES].find((x) => x.id === id);
  if (found) return translate(`type.${found.id}`);
  return id;
};
