import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";

export const ugx = (n) => "UGX " + Math.round(n).toLocaleString("en-UG");

export const TODAY = new Date("2026-07-19");

export const daysTo = (d) => Math.round((new Date(d) - TODAY) / 86400000);

export const dshort = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const STATUS_LABEL = {
  placed: "Payment pending",
  accepted: "Order accepted",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  reserved: "Reserved",
};

export const STATUS_TONE = {
  placed: "b-grey",
  accepted: "b-maize",
  out_for_delivery: "b-maize",
  delivered: "b-green",
  reserved: "b-green",
};

export const typeLabel = (id) => [...SELLER_TYPES, ...BUYER_TYPES].find(x => x.id === id)?.t || id;
