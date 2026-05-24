"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WarehouseStock { warehouseId:string; warehouseName:string; warehouseLocation:string; totalUnits:number; reservedUnits:number; availableUnits:number; }
interface Product { id:string; name:string; description:string; price:number; imageUrl?:string; warehouses:WarehouseStock[]; }

function StockBadge({ available, total }: { available:number; total:number }) {
  const color = available===0?"#ef4444":available/total<0.2?"#f97316":available/total<0.5?"#eab308":"#22c55e";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:"0.72rem", fontFamily:"DM Mono,monospace", color }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:color }} />
      {available} avail
    </span>
  );
}

function ReserveModal({ product, onClose }: { product:Product; onClose:()=>void }) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState(product.warehouses.find(w=>w.availableUnits>0)?.warehouseId??"");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const selected = product.warehouses.find(w=>w.warehouseId===warehouseId);
  const maxQty = selected?.availableUnits??0;

  async function handleReserve() {
    setLoading(true); setError(null);
    const res = await fetch("/api/reservations", { method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ productId:product.id, warehouseId, quantity }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error??"Failed to reserve."); setLoading(false); return; }
    router.push(`/reservations/${data.id}`);
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#141416", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:"16px", padding:"2rem", width:"100%", maxWidth:"420px" }}>
        <h2 style={{ fontSize:"1.1rem", fontWeight:600, marginBottom:"4px" }}>Reserve {product.name}</h2>
        <p style={{ fontSize:"0.85rem", color:"rgba(232,230,223,0.5)", marginBottom:"1.5rem" }}>Hold for 10 minutes while you complete payment.</p>

        <label style={{ display:"block", fontSize:"0.75rem", color:"rgba(232,230,223,0.5)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Warehouse</label>
        <select value={warehouseId} onChange={e=>{setWarehouseId(e.target.value);setQuantity(1);}}
          style={{ width:"100%", background:"#1e1e21", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px",
            padding:"10px 12px", color:"#e8e6df", fontSize:"0.9rem", outline:"none", marginBottom:"1rem" }}>
          {product.warehouses.map(w=>(
            <option key={w.warehouseId} value={w.warehouseId} disabled={w.availableUnits===0}>
              {w.warehouseName} — {w.warehouseLocation} ({w.availableUnits} avail)
            </option>
          ))}
        </select>

        <label style={{ display:"block", fontSize:"0.75rem", color:"rgba(232,230,223,0.5)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Quantity</label>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"1.5rem" }}>
          <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} style={{ width:36,height:36,borderRadius:"8px",border:"1px solid rgba(255,255,255,0.1)",background:"#1e1e21",color:"#e8e6df",fontSize:"1.2rem",cursor:"pointer" }}>−</button>
          <span style={{ fontFamily:"DM Mono,monospace", fontSize:"1.1rem", minWidth:"2rem", textAlign:"center" }}>{quantity}</span>
          <button onClick={()=>setQuantity(q=>Math.min(maxQty,q+1))} style={{ width:36,height:36,borderRadius:"8px",border:"1px solid rgba(255,255,255,0.1)",background:"#1e1e21",color:"#e8e6df",fontSize:"1.2rem",cursor:"pointer" }}>+</button>
          <span style={{ fontSize:"0.8rem", color:"rgba(232,230,223,0.4)" }}>max {maxQty}</span>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:"1.5rem" }}>
          <span style={{ fontSize:"0.85rem", color:"rgba(232,230,223,0.5)" }}>Total</span>
          <span style={{ fontWeight:600, fontSize:"1.1rem" }}>${(product.price*quantity).toFixed(2)}</span>
        </div>

        {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"8px", padding:"10px 14px", fontSize:"0.85rem", color:"#fca5a5", marginBottom:"1rem" }}>{error}</div>}

        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(232,230,223,0.7)", fontSize:"0.9rem", cursor:"pointer" }}>Cancel</button>
          <button onClick={handleReserve} disabled={loading||maxQty===0} style={{ flex:2, padding:"11px", borderRadius:"8px", border:"none", background:maxQty===0||loading?"rgba(99,102,241,0.4)":"#6366f1", color:"#fff", fontSize:"0.9rem", fontWeight:600, cursor:maxQty===0||loading?"not-allowed":"pointer" }}>
            {loading?"Reserving…":maxQty===0?"Out of Stock":"Reserve Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onReserve }: { product:Product; onReserve:(p:Product)=>void }) {
  const totalAvailable = product.warehouses.reduce((s,w)=>s+w.availableUnits,0);
  return (
    <div style={{ background:"#141416", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
      <div style={{ height:140, borderRadius:"10px", background:"linear-gradient(135deg,#1a1a2e,#0f3460)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem" }}>📦</div>
      <div>
        <h3 style={{ fontSize:"1rem", fontWeight:600, letterSpacing:"-0.02em", marginBottom:"4px" }}>{product.name}</h3>
        <p style={{ fontSize:"0.82rem", color:"rgba(232,230,223,0.45)", lineHeight:1.5 }}>{product.description}</p>
      </div>
      <div>
        {product.warehouses.map(w=>(
          <div key={w.warehouseId} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize:"0.78rem", color:"rgba(232,230,223,0.5)" }}>{w.warehouseName}</span>
            <StockBadge available={w.availableUnits} total={w.totalUnits} />
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto" }}>
        <span style={{ fontSize:"1.3rem", fontWeight:700, letterSpacing:"-0.03em" }}>₹{product.price.toLocaleString("en-IN")}</span>
        <button onClick={()=>onReserve(product)} disabled={totalAvailable===0}
          style={{ padding:"8px 18px", borderRadius:"8px", border:"none", background:totalAvailable===0?"rgba(255,255,255,0.06)":"#6366f1",
            color:totalAvailable===0?"rgba(232,230,223,0.3)":"#fff", fontSize:"0.85rem", fontWeight:600,
            cursor:totalAvailable===0?"not-allowed":"pointer" }}>
          {totalAvailable===0?"Sold out":"Reserve"}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product|null>(null);

  useEffect(() => {
    fetch("/api/products").then(r=>r.json()).then(d=>{ setProducts(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(232,230,223,0.4)" }}>Loading inventory…</div>;

  return (
    <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"2rem" }}>
      <div style={{ marginBottom:"2.5rem" }}>
        <h1 style={{ fontSize:"2rem", fontWeight:700, letterSpacing:"-0.04em", marginBottom:"8px" }}>Products</h1>
        <p style={{ color:"rgba(232,230,223,0.4)", fontSize:"0.9rem" }}>{products.length} products · multiple warehouses</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.25rem" }}>
        {products.map(p=><ProductCard key={p.id} product={p} onReserve={setSelected} />)}
      </div>
      {selected && <ReserveModal product={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}
