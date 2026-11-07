import { store, verifyStoreKey, json } from "../../lib/store.mjs";

function cleanMenu(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 1000).map(row => ({
    itemId: String(row?.itemId ?? row?.id ?? "").slice(0, 120),
    itemName: String(row?.itemName ?? row?.title ?? "").slice(0, 200),
    category: String(row?.category ?? "").slice(0, 120),
    icon: String(row?.icon ?? "").slice(0, 80),
    variants: (Array.isArray(row?.variants) ? row.variants : []).slice(0, 30)
      .map(v => ({
        name: String(v?.name ?? "Regular").slice(0, 120),
        price: Number(v?.price) || 0,
      }))
      .filter(v => Number.isFinite(v.price) && v.price > 0 && v.price <= 100000),
  })).filter(item => item.itemId && item.itemName && item.variants.length);
}

export default async function handler(request) {
  if (request.method === "GET") {
    const saved = await store.get("customer-menu", { type: "json" });
    return json({ ok: true, menu: Array.isArray(saved?.menu) ? saved.menu : [], updatedAt: saved?.updatedAt ?? null });
  }

  if (request.method === "PUT") {
    if (!(await verifyStoreKey(request, { registerIfMissing: true }))) {
      return json({ ok: false, message: "This POS device is not authorized to publish the menu." }, 403);
    }
    let body;
    try { body = await request.json(); }
    catch { return json({ ok: false, message: "Invalid JSON request." }, 400); }

    const menu = cleanMenu(body?.menu);
    if (!menu.length) return json({ ok: false, message: "The POS menu is empty or has no valid priced variants." }, 400);

    const updatedAt = new Date().toISOString();
    await store.setJSON("customer-menu", { menu, updatedAt });
    return json({ ok: true, count: menu.length, updatedAt });
  }

  return json({ ok: false, message: "Method not allowed." }, 405, { Allow: "GET, PUT" });
}

export const config = { path: "/api/mobile-menu", method: ["GET", "PUT"] };
