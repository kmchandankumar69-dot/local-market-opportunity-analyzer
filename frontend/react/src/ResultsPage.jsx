// ResultsPage.jsx
// Adds deterministic local-area info (rent/site prices, nearby counts, nearest business, footfall, suitability score)
// to each suggested available location popup. Built on top of previous app behavior (no removal of features).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* ---------- CONFIG (same as before) ---------- */
const BANGALORE_BBOX = { minLat: 12.80, maxLat: 13.15, minLng: 77.45, maxLng: 77.75 };
const RANDOM_POOL = 2000;
const GLOBAL_TARGET = 56;
const MIN_SEP_KM = 0.18;
const MAX_PER_CATEGORY = 14;
const CATEGORY_COLORS = {
  Cafe: "#e63946",
  Bakery: "#ff9000",
  Grocery: "#2bbf59",
  Pharmacy: "#3a86ff",
  Restaurant: "#9b5de5",
  default: "#7f7f7f"
};

/* ---------- Utilities (same core utilities) ---------- */
function randBetween(a, b) { return a + Math.random() * (b - a); }
function sampleRandomPoints(n, bbox) {
  const pts = [];
  for (let i=0;i<n;i++) pts.push([randBetween(bbox.minLat,bbox.maxLat), randBetween(bbox.minLng,bbox.maxLng)]);
  return pts;
}
function haversineKm(a, b){
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b[0]-a[0]), dLon = toRad(b[1]-a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}
function safeParseCsv(text){
  try{
    const lines = (text||"").trim().split("\n").filter(Boolean);
    if (lines.length <= 1) return [];
    return lines.slice(1).map((l,i)=>{
      const p = l.split(",");
      return { name: (p[0]||`biz-${i}`).trim(), category: (p[1]||"").trim(), lat: parseFloat(p[2])||0, lng: parseFloat(p[3])||0 };
    });
  }catch(e){ console.error("CSV parse error", e); return []; }
}
function isBadCategory(c){
  if(!c) return true;
  const lc = String(c).trim().toLowerCase();
  if(!lc) return true;
  if(lc==="unknown"||lc==="helvetica") return true;
  if(lc.includes("hidden")) return true;
  return false;
}
function computeCentroid(items){
  const pts = (items||[]).filter(p=>p && !isNaN(p.lat) && !isNaN(p.lng) && !(Number(p.lat)===0 && Number(p.lng)===0));
  if(!pts.length) return null;
  const sum = pts.reduce((s,p)=>{ s.lat+=p.lat; s.lng+=p.lng; return s; }, {lat:0,lng:0});
  return [sum.lat/pts.length, sum.lng/pts.length];
}

/* ---------- Pan helper ---------- */
function PanToMarker({ coords, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (!coords) return;
    try { map.flyTo(coords, zoom || 13, { duration: 0.6 }); } catch(e) {}
  }, [coords, zoom, map]);
  return null;
}

/* ---------- New: Local-area info helpers ---------- */

/*
 deterministicSeed(lat,lng)
 Produce a deterministic pseudo-random value in [0,1) for given coords so popup values are stable.
*/
function deterministicSeed(lat, lng) {
  // simple hash using sin of combination
  const s = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/*
 estimateLocalInfo(coords, category, businesses)
 - uses distance to city center and nearby business density to estimate:
    * suggested monthly rent (INR) for a small shop
    * estimated price per sqft (INR)
    * nearby business count within radius (500m)
    * nearest business name & distance
    * mock footfall estimate (people/day)
    * suitability score (0-100)
*/
function estimateLocalInfo(coords, category, businesses) {
  const [lat,lng] = coords;
  if (!lat || !lng) return null;

  // center of Bangalore bbox (approx)
  const center = [(BANGALORE_BBOX.minLat + BANGALORE_BBOX.maxLat)/2, (BANGALORE_BBOX.minLng + BANGALORE_BBOX.maxLng)/2];
  const distToCenterKm = haversineKm(coords, center);

  // compute nearby business count within 0.5 km and nearest business
  const R_NEAR = 0.5; // km
  let nearbyCount = 0;
  let nearest = null;
  let nearestD = 1e9;
  for (const b of businesses) {
    if (!b || !b.lat || !b.lng) continue;
    const d = haversineKm(coords, [b.lat, b.lng]);
    if (d < R_NEAR) nearbyCount++;
    if (d < nearestD) { nearestD = d; nearest = b; }
  }

  // deterministic random factor
  const seed = deterministicSeed(lat, lng); // in [0,1)

  // Base price-per-sqft and rent logic (unchanged idea, slight tweak)
  const basePricePerSqft = 60 + (40 * Math.max(0, 3 - distToCenterKm)); // ~60..180
  const densityFactor = 1 + Math.log10(1 + nearbyCount); // grows slowly with nearbyCount
  const pricePerSqft = Math.round((basePricePerSqft * densityFactor * (0.85 + 0.3 * seed)));

  // Rent per month for small shop
  const shopSqft = 200;
  let rent = Math.round(pricePerSqft * shopSqft * (0.07 + 0.04 * seed));
  const categoryMultiplier = {
    Cafe: 1.2,
    Bakery: 1.1,
    Grocery: 1.0,
    Pharmacy: 1.15,
    Restaurant: 1.25
  }[category] || 1.0;
  rent = Math.round(rent * categoryMultiplier);

  // footfall estimate: stronger weight on nearbyCount and moderate center proximity
  const footfall = Math.round(80 + nearbyCount * 40 + Math.max(0, 200 - distToCenterKm*30) * (0.35 + seed*0.65));

  // same-category saturation (count)
  const sameCatCount = businesses.filter(b => b.category === category).length;
  const saturation = Math.min(1, sameCatCount / 8); // softer penalty (divisor 8)

  // NEW suitability formula (more generous):
  // - nearbyNorm: how many nearby businesses relative to a comfortable neighborhood size
  const nearbyNorm = Math.tanh(nearbyCount / 6); // 0..~1
  // - centerFactor: closeness to center (0..1)
  const centerFactor = Math.max(0, 1 - distToCenterKm / 6);
  // combine: weight nearby and center, reduce by saturation, small seed jitter
  let suitabilityFloat = 0.55 * nearbyNorm + 0.35 * centerFactor + 0.10 * (1 - saturation);
  // scale to 0-100 and add small seed-based tweak
  let suitability = Math.round(suitabilityFloat * 100 + (seed - 0.5) * 8);
  // clamp to a friendly band
  suitability = Math.max(30, Math.min(95, suitability));

  return {
    rentPerMonthINR: rent,
    pricePerSqftINR: pricePerSqft,
    nearbyBusinessCount: nearbyCount,
    nearestBusinessName: nearest ? nearest.name : null,
    nearestBusinessDistanceKm: nearest ? Number(nearestD.toFixed(3)) : null,
    footfallPerDay: footfall,
    suitabilityScore: suitability
  };
}


/* ---------- Component (same UI + enhanced popups) ---------- */
export default function ResultsPage(){
  const [results, setResults] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [visibleCats, setVisibleCats] = useState(new Set());
  const [chosenByCat, setChosenByCat] = useState({});
  const [panTo, setPanTo] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const randomPool = useMemo(() => sampleRandomPoints(RANDOM_POOL, BANGALORE_BBOX), []);

  useEffect(()=>{
    mountedRef.current = true;
    (async ()=>{
      try {
        const r = await fetch("http://localhost:4000/api/opportunities/compute", { method: "POST" });
        if (!r.ok) throw new Error(`Backend ${r.status}`);
        const txt = await r.text();
        if(!txt) throw new Error("Empty backend response");
        const j = JSON.parse(txt);
        if(!j.ok || !Array.isArray(j.results)) throw new Error("Invalid backend payload");
        const clean = j.results.map(x => ({ ...x, category: (x.category||"").trim() })).filter(x => !isBadCategory(x.category));
        if (mountedRef.current) { setResults(clean); const cats = new Set(clean.map(x=>x.category)); setVisibleCats(cats); }

        const csvResp = await fetch("/data/sample_businesses.csv");
        const csvText = await csvResp.text();
        const parsed = safeParseCsv(csvText).map(b => ({ ...b, category: (b.category||"").trim() })).filter(b => b && !isBadCategory(b.category));
        if (mountedRef.current) {
          setBusinesses(parsed);
          setVisibleCats(prev=>{
            const n = new Set(prev);
            parsed.forEach(bb => { if (bb.category) n.add(bb.category); });
            return n;
          });
        }
      } catch(e){
        console.error("Load error", e);
        if (mountedRef.current) setError(String(e.message||e));
      }
    })();

    return ()=>{ mountedRef.current = false; };
  }, []);

  // index businesses by category
  const bizByCat = useMemo(()=>{
    const idx = {};
    for(const b of businesses){
      const c = b.category || "Other";
      if(!idx[c]) idx[c]=[];
      idx[c].push(b);
    }
    return idx;
  }, [businesses]);

  // compute per-category candidate lists
  const perCatCandidates = useMemo(()=>{
    const out = {};
    for (const op of results){
      const cat = op.category;
      if(!cat) continue;
      const catBiz = bizByCat[cat] || [];
      const arr = [];
      for (const pt of randomPool){
        const coincide = catBiz.some(b => Math.abs(b.lat-pt[0])<1e-7 && Math.abs(b.lng-pt[1])<1e-7);
        if(coincide) continue;
        const dSame = catBiz.length ? Math.min(...catBiz.map(b => haversineKm(pt, [b.lat,b.lng]))) : 9999;
        const dAny = businesses.length ? Math.min(...businesses.map(b => haversineKm(pt, [b.lat,b.lng]))) : 9999;
        let score = dSame;
        if (dAny > 3.5) score -= (dAny - 3.5) * 0.6;
        arr.push({ coords: pt, score, dSame, dAny });
      }
      arr.sort((a,b)=>b.score - a.score);
      out[cat] = arr;
    }
    return out;
  }, [results, bizByCat, randomPool, businesses]);

  // allocation: assign distinct points across categories (same algorithm as before)
  useEffect(()=>{
    try {
      const chosenCoords = [];
      const mapChosen = {};
      const cats = Object.keys(perCatCandidates);
      if (cats.length === 0) { setChosenByCat({}); return; }
      const base = Math.floor(GLOBAL_TARGET / cats.length);
      const perCatTarget = {};
      for (const c of cats) perCatTarget[c] = Math.min(MAX_PER_CATEGORY, base + Math.floor(Math.random()*2));
      const catQueues = {};
      for (const c of cats) catQueues[c] = perCatCandidates[c] ? perCatCandidates[c].slice() : [];
      let pickedTotal = 0;
      let round = 0;
      while (pickedTotal < GLOBAL_TARGET && round < 2000) {
        let anyPickedThisRound = false;
        for (const c of cats) {
          if (pickedTotal >= GLOBAL_TARGET) break;
          if (!catQueues[c] || catQueues[c].length === 0) continue;
          const target = perCatTarget[c] || Math.ceil(GLOBAL_TARGET / cats.length);
          if (!mapChosen[c]) mapChosen[c] = [];
          if (mapChosen[c].length >= target) continue;
          let chosenIndex = -1;
          for (let i=0;i<catQueues[c].length;i++){
            const cand = catQueues[c][i];
            const tooClose = chosenCoords.some(cc => haversineKm(cc, cand.coords) < MIN_SEP_KM);
            if (!tooClose) { chosenIndex = i; break; }
          }
          if (chosenIndex >= 0) {
            const cand = catQueues[c].splice(chosenIndex,1)[0];
            mapChosen[c].push(cand);
            chosenCoords.push(cand.coords);
            pickedTotal++;
            anyPickedThisRound = true;
          } else {
            catQueues[c].splice(0, Math.min(3, catQueues[c].length));
          }
        }
        if (!anyPickedThisRound) break;
        round++;
      }
      if (pickedTotal < GLOBAL_TARGET) {
        for (const c of cats) {
          const q = perCatCandidates[c] || [];
          if (!mapChosen[c]) mapChosen[c] = [];
          for (const cand of q) {
            if (pickedTotal >= GLOBAL_TARGET) break;
            const exists = chosenCoords.some(cc => Math.abs(cc[0]-cand.coords[0])<1e-7 && Math.abs(cc[1]-cand.coords[1])<1e-7);
            if (exists) continue;
            mapChosen[c].push(cand);
            chosenCoords.push(cand.coords);
            pickedTotal++;
          }
          if (pickedTotal >= GLOBAL_TARGET) break;
        }
      }
      // cap per category (small helper)
      const finalMap = {};
      const fallbackLimit = () => {
        const catsCount = Object.keys(perCatCandidates).length || 1;
        const approx = Math.ceil(GLOBAL_TARGET / catsCount);
        return Math.max(4, Math.min(MAX_PER_CATEGORY, approx));
      };
      for (const c of Object.keys(mapChosen)) finalMap[c] = mapChosen[c].slice(0, fallbackLimit());
      setChosenByCat(finalMap);
    } catch(e) {
      console.error("Allocation error", e);
    }
  }, [perCatCandidates]);

  // UI actions
  const onClickOpportunity = (op) => {
    const cat = op.category;
    setActiveCat(cat);
    const arr = chosenByCat[cat] || [];
    if (arr.length) setPanTo(arr[0].coords);
    else {
      const centroid = computeCentroid(bizByCat[cat] || []);
      setPanTo(centroid || [(BANGALORE_BBOX.minLat + BANGALORE_BBOX.maxLat)/2, (BANGALORE_BBOX.minLng + BANGALORE_BBOX.maxLng)/2]);
    }
    setVisibleCats(prev => { const n = new Set(prev); if (cat) n.add(cat); return n; });
  };

  const [visibleCatsLocal, setVisibleCatsLocal] = useState(null);
  useEffect(()=> setVisibleCatsLocal(Array.from(visibleCats || new Set())), [visibleCats]);

  const toggleVisibility = (cat) => {
    setVisibleCats(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  };

  const legendCats = useMemo(() => Array.from(new Set([...Object.keys(bizByCat), ...results.map(r=>r.category)])).filter(c => c && !isBadCategory(c)), [bizByCat, results]);

  // helper: compute local info for a suggested candidate (uses businesses array)
  function localInfoFor(candidate, category) {
    if (!candidate || !candidate.coords) return null;
    return estimateLocalInfo(candidate.coords, category, businesses);
  }

  // Render
  return (
    <div style={{ display: "flex", gap: 12, padding: 10 }}>
      <div style={{ flex: 1, minWidth: 340 }}>
        <h2 style={{ marginTop: 0 }}>Opportunities</h2>
        {error && <div style={{ color: "red" }}>{String(error)}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.filter(r=>r && r.category).map((r, idx) => {
            const color = CATEGORY_COLORS[r.category] || CATEGORY_COLORS.default;
            const count = (chosenByCat[r.category] || []).length;
            return (
              <div key={`op-${idx}`} onClick={() => onClickOpportunity(r)} style={{ cursor: "pointer", padding: 10, borderRadius: 8, border: activeCat===r.category?`2px solid ${color}`:"1px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width: 14, height: 14, background: color, borderRadius: 3, border: "1px solid #333" }}></div>
                  <div>
                    <div style={{ fontWeight:700 }}>{r.category}</div>
                    <div style={{ fontSize:12, color:"#666" }}>score: {r.score}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>{count} spots</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <h4 style={{ marginBottom: 8 }}>Categories</h4>
          {legendCats.map((cat, i) => (
            <div key={`cat-${i}`} style={{ display:"flex", alignItems:"center", gap:8, padding:6, background:"#fafafa", borderRadius:6, marginBottom:6 }}>
              <div style={{ width:12, height:12, background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.default, borderRadius:3 }} />
              <div style={{ flex:1 }}>{cat}</div>
              <div><button onClick={() => toggleVisibility(cat)}>{visibleCats.has(cat) ? "Hide" : "Show"}</button></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "72%", minWidth: 640, height: 760, position: "relative" }}>
        <div style={{ position: "absolute", right: 12, top: 12, zIndex: 700, background: "#fff", padding: 10, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          {legendCats.map((cat,i) => (<div key={`lg-${i}`} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}><div style={{ width:14, height:14, background:CATEGORY_COLORS[cat]||CATEGORY_COLORS.default, borderRadius:4, border:"1px solid #333" }} /><div style={{ fontSize:13 }}>{cat}</div></div>))}
          <div style={{ marginTop: 8, fontSize: 12, color: "#444" }}>Bright = suggested available spots</div>
        </div>

        <MapContainer center={[(BANGALORE_BBOX.minLat + BANGALORE_BBOX.maxLat)/2, (BANGALORE_BBOX.minLng + BANGALORE_BBOX.maxLng)/2]} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {panTo && <PanToMarker coords={panTo} zoom={13} />}

          {/* existing businesses */}
          {businesses.map((b, i) => {
            if (!b || !b.lat || !b.lng) return null;
            if (!visibleCats.has(b.category)) return null;
            const color = CATEGORY_COLORS[b.category] || CATEGORY_COLORS.default;
            return (
              <CircleMarker key={`biz-${i}-${b.name}`} center={[b.lat, b.lng]} radius={5} pathOptions={{ color, fillColor: color, fillOpacity: 0.95 }}>
                <Popup><div style={{ fontWeight:700 }}>{b.name}</div><div style={{ fontSize:12 }}>{b.category}</div></Popup>
              </CircleMarker>
            );
          })}

          {/* suggested spots: distinct per category; enhanced popup shows local info */}
          {Object.entries(chosenByCat).map(([cat, arr]) => {
            if (!visibleCats.has(cat)) return null;
            const inner = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
            const halo = "#fff176";
            return arr.map((s, i) => {
              const [lat,lng] = s.coords || [null, null];
              if (!lat || !lng) return null;
              const isBest = i === 0 && activeCat === cat;
              const haloR = isBest ? 28 : 18;
              const innerR = isBest ? 12 : 8;
              const local = localInfoFor(s, cat); // new info
              return (
                <React.Fragment key={`sugg-${cat}-${i}`}>
                  <CircleMarker center={[lat, lng]} radius={haloR} pathOptions={{ color: halo, fillColor: halo, fillOpacity: 0.12, weight: 2 }} />
                  <CircleMarker center={[lat, lng]} radius={innerR} pathOptions={{ color: "#ff6600", fillColor: inner, fillOpacity: 0.98, weight: 2 }}>
                    <Popup minWidth={240}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{cat} — suggested spot</div>

                      {local ? (
                        <div style={{ fontSize: 13 }}>
                          <div><strong>Estimated rent (monthly):</strong> ₹{local.rentPerMonthINR.toLocaleString()}</div>
                          <div><strong>Est. price / sqft:</strong> ₹{local.pricePerSqftINR} / sqft</div>
                          <div><strong>Nearby businesses (500m):</strong> {local.nearbyBusinessCount}</div>
                          <div><strong>Nearest business:</strong> {local.nearestBusinessName ? `${local.nearestBusinessName} (${local.nearestBusinessDistanceKm} km)` : "N/A"}</div>
                          <div><strong>Estimated footfall:</strong> ~{local.footfallPerDay} people/day</div>
                          <div><strong>Suitability score:</strong> {local.suitabilityScore} / 100</div>
                          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                            Note: these are demo estimates (derived from local density & distance). For production, replace with real rent/market data.
                          </div>
                        </div>
                      ) : (
                        <div>Info not available</div>
                      )}

                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            });
          })}
        </MapContainer>
      </div>
    </div>
  );
}

/* Mount safely */
const rootEl = document.getElementById("root");
if (rootEl) {
  try {
    const root = createRoot(rootEl);
    root.render(<ResultsPage />);
  } catch (e) {
    console.error("Mount error", e);
    rootEl.innerText = "UI mount error: " + (e.message || e);
  }
} else {
  console.error("Root element (#root) not found.");
}
