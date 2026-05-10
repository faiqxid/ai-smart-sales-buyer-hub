import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_gemini_client(db=None):
    """Inisialisasi Gemini client. Prioritas key dari DB config, fallback ke ENV."""
    api_key = None
    try:
        if db is not None:
            from app.services.app_config_service import get_effective_gemini_api_key
            api_key = get_effective_gemini_api_key(db)
    except Exception as e:
        logger.warning(f"Gagal baca Gemini key dari DB config: {e}")

    if not api_key:
        api_key = settings.GEMINI_API_KEY

    if not api_key:
        logger.warning("GEMINI_API_KEY tidak dikonfigurasi (DB/ENV). Menggunakan fallback deterministic.")
        return None

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        logger.error(f"Gagal inisialisasi Gemini client: {e}")
        return None


async def generate_daily_briefing(data: dict, db=None) -> str:
    """
    Generate ringkasan harian untuk sales menggunakan Gemini.
    Fallback ke pesan deterministic jika Gemini tidak tersedia.
    """
    # Fallback deterministic
    expiring = data.get("expiring_items", [])
    pending_returns = data.get("pending_returns", [])
    low_stock = data.get("low_stock", [])
    pending_preorders = data.get("pending_preorders", 0)
    finance = data.get("finance", {})
    top_products = data.get("top_products_7_hari", [])

    client = _get_gemini_client(db)
    if not client:
        return _fallback_daily_briefing(data)

    prompt = f"""
Kamu adalah AI Business Copilot untuk sales roti/jajanan UMKM Indonesia.
Tugasmu membuat briefing harian yang ringkas, praktis, dan bisa langsung dieksekusi sales lapangan.

Data operasional:
- Item mendekati expired: {expiring}
- Retur belum ditarik: {pending_returns}
- Produk stok rendah/kosong: {low_stock}
- Pre-order pending: {pending_preorders}

Data keuangan (estimasi):
- Omzet hari ini: Rp{finance.get('omzet_hari_ini', 0):,.0f}
- Omzet 7 hari: Rp{finance.get('omzet_7_hari', 0):,.0f}
- Profit estimasi hari ini (margin {int((finance.get('margin_asumsi', 0.2))*100)}%): Rp{finance.get('profit_estimasi_hari_ini', 0):,.0f}
- Profit estimasi 7 hari: Rp{finance.get('profit_estimasi_7_hari', 0):,.0f}
- Jumlah order hari ini: {finance.get('total_order_hari_ini', 0)}
- Jumlah order 7 hari: {finance.get('total_order_7_hari', 0)}

Top produk 7 hari terakhir:
{top_products}

Output WAJIB format ini (bahasa Indonesia):
RINGKASAN:
[2-3 kalimat padat]

INSIGHT KEUANGAN:
1. [poin 1]
2. [poin 2]

PRIORITAS AKSI HARI INI:
1. [aksi 1]
2. [aksi 2]
3. [aksi 3]

PERINGATAN RISIKO:
[isi risiko, atau tulis 'Tidak ada risiko besar hari ini.']

PENTING: output HARUS plain text tanpa markdown.
JANGAN gunakan karakter markdown seperti **, *, #, -, atau ```.
Gunakan hanya teks biasa, angka, titik, dan titik dua.

Gaya: profesional santai, anti bertele-tele, relevan untuk UMKM.
"""
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini daily briefing error: {e}")
        return _fallback_daily_briefing(data)


def _fallback_daily_briefing(data: dict) -> str:
    expiring = data.get("expiring_items", [])
    pending_returns = data.get("pending_returns", [])
    low_stock = data.get("low_stock", [])
    pending_preorders = data.get("pending_preorders", 0)

    parts = []
    if expiring:
        parts.append(f"Ada {len(expiring)} item yang mendekati expired, segera ditarik.")
    if pending_returns:
        parts.append(f"Ada {len(pending_returns)} retur yang belum ditarik dari toko.")
    if low_stock:
        names = ", ".join([p["nama"] for p in low_stock[:3]])
        parts.append(f"Stok menipis/habis: {names}.")
    if pending_preorders > 0:
        parts.append(f"Ada {pending_preorders} pre-order yang belum terpenuhi.")

    if not parts:
        return "Hari ini semua aman. Tidak ada item expired, retur, atau stok kritis. Selamat berjualan!"

    return " ".join(parts)


async def generate_preorder_allocation(product: dict, preorders: list, available_stock: int, db=None) -> dict:
    """
    Generate rekomendasi alokasi pre-order saat stok baru ditambahkan.
    Logika deterministic: FIFO berdasarkan created_at.
    """
    # Logika deterministic (wajib ada terlepas dari Gemini)
    allocations = []
    remaining = available_stock

    for po in preorders:
        if remaining <= 0:
            break
        needed = po["qty_request"] - po["qty_matched"]
        alloc = min(needed, remaining)
        if alloc > 0:
            allocations.append({
                "pre_order_id": po["id"],
                "buyer_id": po["buyer_id"],
                "nama_toko": po.get("nama_toko", "-"),
                "qty_allocated": alloc,
                "status": "matched" if alloc >= needed else "partial",
            })
            remaining -= alloc

    result = {
        "product_id": product["id"],
        "nama_produk": product["nama_produk"],
        "stok_tersedia": available_stock,
        "sisa_stok": remaining,
        "alokasi": allocations,
        "ai_recommendation": None,
    }

    client = _get_gemini_client(db)
    if client and allocations:
        try:
            prompt = f"""
Kamu adalah asisten sales. Beri rekomendasi singkat (1-2 kalimat, bahasa Indonesia) untuk alokasi pre-order:

Produk: {product['nama_produk']}
Stok tersedia: {available_stock} ball
Alokasi: {allocations}
Sisa stok setelah alokasi: {remaining} ball

Beri saran singkat dan praktis.
"""
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt,
            )
            result["ai_recommendation"] = response.text.strip()
        except Exception as e:
            logger.error(f"Gemini preorder matcher error: {e}")

    return result


async def generate_invoice_message(order: dict, buyer: dict, items: list, db=None) -> str:
    """
    Generate pesan tagihan WhatsApp menggunakan Gemini.
    """
    nama_toko = buyer.get("nama_toko") or buyer.get("nama_lengkap", "Pelanggan")
    total = order.get("total_tagihan", 0)
    potongan = order.get("total_potongan_retur", 0)
    grand = order.get("grand_total", 0)

    client = _get_gemini_client(db)
    if not client:
        return _fallback_invoice_message(nama_toko, total, potongan, grand, items)

    items_text = "\n".join([
        f"- {i['nama_produk']} x{i['qty']} @ Rp{i['harga_satuan']:,.0f} = Rp{i['subtotal']:,.0f}"
        for i in items
    ])

    prompt = f"""
Buat pesan tagihan WhatsApp untuk sales roti/jajanan keliling dalam bahasa Indonesia yang ramah dan singkat.

Nama toko: {nama_toko}
Detail pesanan:
{items_text}
Total pesanan: Rp{total:,.0f}
Potongan retur: Rp{potongan:,.0f}
Total bersih: Rp{grand:,.0f}

Format pesan singkat, santai, dan profesional. Sertakan sapaan, detail tagihan, dan ucapan terima kasih.
Maksimal 5-6 baris.
"""
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini invoice message error: {e}")
        return _fallback_invoice_message(nama_toko, total, potongan, grand, items)


def _fallback_invoice_message(nama_toko, total, potongan, grand, items) -> str:
    items_text = "\n".join([
        f"- {i['nama_produk']} x{i['qty']} = Rp{float(i['subtotal']):,.0f}"
        for i in items
    ])
    msg = f"Halo {nama_toko}, berikut tagihan hari ini:\n{items_text}\n"
    msg += f"Total pesanan: Rp{float(total):,.0f}\n"
    if float(potongan) > 0:
        msg += f"Potongan retur: Rp{float(potongan):,.0f}\n"
    msg += f"*Total bersih: Rp{float(grand):,.0f}*\nTerima kasih!"
    return msg
