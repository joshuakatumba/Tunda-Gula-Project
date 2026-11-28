import { useState, useEffect, useCallback, useMemo } from "react";
import { CATEGORIES, EMOJI } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { ENDPOINTS } from "../api/endpoints";
import { Mic, Loader2 } from "lucide-react";
import { SkeletonGrid } from "../components/ui/Skeleton";
import { getCached } from "../utils/apiCache";
import { useDebounce } from "../utils/debounce";
import { Thumb } from "../components/Thumb";
import { FilterChips } from "../components/FilterChips";
import { Modal } from "../components/Modal";
import { useI18n } from "../context/I18nContext";
function mapApiListing(l) {
  return {
    id: `L-${l.id}`,
    seller: l.seller_name,
    sellerId: `S-${l.seller}`,
    sellerType: "",
    district: l.district,
    cat: l.category,
    name: l.name,
    qty: l.quantity,
    unit: l.unit,
    price: l.price,
    rating: l.seller_rating || 0,
    ratings: l.seller_rating_count || 0,
    verified: l.seller_verified,
    top: (l.seller_rating >= 4.5 && l.seller_rating_count >= 5),
    voice: l.voice_duration || 0,
    thumbnail: l.thumbnail || null,
    photos: l.photo_count || 0,
    photos_data: l.photos || [],
    voice_file: l.voice_file || null,
    ref: Math.round(l.price * 1.06),
    note: l.description || ""
  };
}
export default function Marketplace({ f, setF, onOpen, cart, cartTotal, onCheckout }) {
  const { t, tp, tu } = useI18n();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQ = useDebounce(f.q, 400);
  const fetchListings = useCallback(async (filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.cat && filters.cat !== "All") params.set("category", filters.cat);
      if (filters.district && filters.district !== "All") params.set("district", filters.district);
      if (filters.max) params.set("max_price", filters.max);
      if (filters.q) params.set("q", filters.q);
      if (filters.sort && filters.sort !== "relevance") params.set("sort", filters.sort);
      const queryString = params.toString();
      const url = queryString ? `${ENDPOINTS.listings}?${queryString}` : ENDPOINTS.listings;
      const res = await getCached(url, 1e4);
      const items = Array.isArray(res) ? res : res.results || [];
      setTotal(res.count ?? items.length);
      if (items.length > 0) {
        let mapped = items.map(mapApiListing);
        if (filters.minRating > 0) {
          mapped = mapped.filter((l) => l.rating >= filters.minRating);
        }
        setListings(mapped);
      } else {
        setListings([]);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchListings({ ...f, q: debouncedQ });
  }, [f.cat, f.district, f.max, f.sort, f.minRating, debouncedQ, fetchListings]);
  const districts = useMemo(() => ["All", ...Array.from(new Set(listings.map((l) => l.district)))].filter(Boolean), [listings]);
  const shown = useMemo(() => listings.filter((l) => l.rating >= f.minRating), [listings, f.minRating]);
  return <><Head
    title={t("buyer.marketplace")}
    action={cart.length > 0 ? <Button variant="primary" onClick={onCheckout}>
              {t("buyer.basket")} · {ugx(cartTotal)} ({cart.length})
            </Button> : void 0}
  /><div style={{ position: "sticky", top: 64, zIndex: 30, background: "var(--color-paper)", padding: "8px 0 12px" }}><div className="row" style={{ gap: 8, flexWrap: "nowrap" }}><div style={{ flex: 1, position: "relative" }}><i className="bx bx-search" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--color-slate)", fontSize: 20 }} /><input
    value={f.q}
    placeholder={t("common.search")}
    onChange={(e) => setF({ ...f, q: e.target.value })}
    style={{ paddingLeft: 44, borderRadius: 9999, height: 44 }}
  /></div><button
    className="btn-alt"
    style={{ width: 44, height: 44, padding: 0, borderRadius: 9999, flexShrink: 0 }}
    onClick={() => setShowFilters(true)}
    aria-label={t("common.filter")}
  ><i className="bx bx-slider-alt" style={{ fontSize: 20 }} /></button></div><div style={{ marginTop: 12 }}><FilterChips
    options={[{ id: "All", label: t("cat.All") }, ...CATEGORIES.map((c) => ({ id: c, label: t(`cat.${c}`) }))]}
    activeId={f.cat}
    onChange={(id) => setF({ ...f, cat: id })}
  /></div></div><div className="row" style={{ marginBottom: 16, alignItems: "center" }}><span style={{ fontSize: "13px", color: "var(--color-slate)", display: "inline-flex", alignItems: "center", gap: 6 }}>{loading && <Loader2 size={14} className="spin" />}{shown.length} / {total}
        </span></div>{loading && shown.length === 0 ? <SkeletonGrid count={6} /> : shown.length === 0 && !loading ? <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}><h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>{t("buyer.no_produce")}</h2><Button variant="outline" onClick={() => setF({ q: "", cat: "All", district: "All", max: "", minRating: 0, sort: "relevance" })}>
            {t("common.clear_filters")}
          </Button></div> : <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>{shown.map((l) => <button
    className="listing"
    key={l.id}
    onClick={() => onOpen(l.id)}
    style={{ textAlign: "left", cursor: "pointer", padding: 0 }}
  ><div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}><Thumb
    src={l.thumbnail || (l.photos > 0 && l.photos_data?.[0]?.image ? l.photos_data[0].image : null)}
    alt={l.name}
    fallback={EMOJI[l.cat]}
    size="100%"
    className="listing-thumb"
  /></div><div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}><h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-obsidian)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tp(l.name)}</h3><div style={{ fontSize: "12px", color: "var(--color-slate)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.district}{l.verified ? " · ✓" : ""}</div><div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-forest-ink)", marginTop: 4 }}>{ugx(l.price)} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--color-pebble)" }}>/{tu(l.unit)}</span></div></div></button>)}</div>}{showFilters && <Modal
    title={t("common.filter")}
    onClose={() => setShowFilters(false)}
    footer={<Button block variant="primary" onClick={() => setShowFilters(false)}>
              {t("buyer.show_results", { count: shown.length })}
            </Button>}
  ><div className="stack" style={{ gap: "24px" }}><Field label={t("buyer.district")}><select value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })}>{districts.map((x) => <option key={x} value={x}>{x === "All" ? t("common.all") : x}</option>)}</select></Field><Field label={t("buyer.max_price")}><input type="number" value={f.max} placeholder={t("filter.any_price")} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field><Field label={t("buyer.sort_by")}><select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}><option value="relevance">{t("filter.sort_relevance")}</option><option value="price">{t("filter.sort_price")}</option><option value="rating">{t("filter.sort_rating")}</option><option value="newest">{t("filter.sort_newest")}</option></select></Field><div><div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-obsidian)", marginBottom: "8px" }}>{t("buyer.rating_min")}</div><div className="row" style={{ gap: "8px", flexWrap: "wrap" }}>{[0, 3, 4, 4.5].map((r) => <button
    key={r}
    className="btn-sm"
    onClick={() => setF({ ...f, minRating: r })}
    style={f.minRating === r ? { borderColor: "var(--color-forest-ink)", background: "var(--color-linen-mist)", fontWeight: 600 } : void 0}
  >{r === 0 ? t("buyer.any") : t("filter.stars_plus", { r })}</button>)}</div></div><Button variant="text" onClick={() => setF({ ...f, district: "All", max: "", minRating: 0, sort: "relevance" })}>
              {t("filter.clear_all")}
            </Button></div></Modal>}</>;
}
