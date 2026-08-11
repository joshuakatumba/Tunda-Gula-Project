import React from "react";
import { Sprout, Tractor, Users, Store, Home, Soup, ShoppingCart, Handshake } from "lucide-react";

export const SELLER_TYPES = [
  { id: "smallholder", ic: <Sprout size="1em" />, t: "Smallholder farmer", d: "You farm your own land and sell what you harvest." },
  { id: "commercial", ic: <Tractor size="1em" />, t: "Commercial farm", d: "A registered farm selling in bulk, season after season." },
  { id: "group", ic: <Users size="1em" />, t: "Farmer group or cooperative", d: "You sell on behalf of several farmers together." },
  { id: "aggregator", ic: <Store size="1em" />, t: "Aggregator or produce store", d: "You buy from farmers nearby and resell on the platform." },
];

export const BUYER_TYPES = [
  { id: "household", ic: <Home size="1em" />, t: "Household", d: "Food for your family, delivered from the farm." },
  { id: "restaurant", ic: <Soup size="1em" />, t: "Restaurant or hotel", d: "Regular supply for a kitchen you run." },
  { id: "supermarket", ic: <ShoppingCart size="1em" />, t: "Supermarket or retailer", d: "Bulk supply with consistent quality and volume." },
  { id: "cooperative", ic: <Handshake size="1em" />, t: "Cooperative or institution", d: "Buying for a school, hospital, church or group." },
];
