"""
Seed data untuk development/testing.
Jalankan: python seed.py (dari folder backend/)
"""
import os
import sys
import uuid
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.pre_order import PreOrder


def seed():
    db = SessionLocal()
    try:
        print("🌱 Mulai seed data...")

        # === USERS ===
        admin = db.query(User).filter(User.username == "admin1").first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                username="admin1",
                password_hash=hash_password("admin123"),
                role="admin",
                nama_lengkap="Super Admin",
                nomor_hp="628000000000",
                alamat="Office",
            )
            db.add(admin)
            print("  ✅ Admin: username=admin1, password=admin123")

        sales = db.query(User).filter(User.username == "sales1").first()
        if not sales:
            sales = User(
                id=uuid.uuid4(),
                username="sales1",
                password_hash=hash_password("sales123"),
                role="sales",
                nama_lengkap="Bapak Rudi Sales",
                nomor_hp="628123456789",
                alamat="Jl. Kenanga No. 5, Bandung",
            )
            db.add(sales)
            print("  ✅ Sales: username=sales1, password=sales123")

        buyers_data = [
            {"username": "toko_makmur", "nama_toko": "Toko Makmur", "nomor_hp": "628111222333", "alamat": "Jl. Merdeka No. 10"},
            {"username": "warung_barokah", "nama_toko": "Warung Barokah", "nomor_hp": "628444555666", "alamat": "Jl. Pahlawan No. 7"},
            {"username": "toko_sejahtera", "nama_toko": "Toko Sejahtera", "nomor_hp": "628777888999", "alamat": "Jl. Sudirman No. 3"},
        ]
        buyer_records = []
        for bd in buyers_data:
            b = db.query(User).filter(User.username == bd["username"]).first()
            if not b:
                b = User(
                    id=uuid.uuid4(),
                    username=bd["username"],
                    password_hash=hash_password("buyer123"),
                    role="buyer",
                    nama_toko=bd["nama_toko"],
                    nomor_hp=bd["nomor_hp"],
                    alamat=bd["alamat"],
                )
                db.add(b)
                print(f"  ✅ Buyer: {bd['username']} / buyer123")
            buyer_records.append(b)
        db.flush()

        # === PRODUCTS ===
        products_data = [
            {"nama": "Roti Coklat", "kategori": "Roti Manis", "harga": 15000, "stok": 20},
            {"nama": "Roti Keju", "kategori": "Roti Manis", "harga": 17000, "stok": 15},
            {"nama": "Roti Tawar Jumbo", "kategori": "Roti Tawar", "harga": 22000, "stok": 10},
            {"nama": "Donat Gula", "kategori": "Kue", "harga": 8000, "stok": 30},
            {"nama": "Brownies Kukus", "kategori": "Kue", "harga": 35000, "stok": 5},
            {"nama": "Roti Abon", "kategori": "Roti Gurih", "harga": 12000, "stok": 0},
            {"nama": "Croissant Butter", "kategori": "Pastry", "harga": 25000, "stok": 3},
        ]
        prod_records = {}
        for pd in products_data:
            p = db.query(Product).filter(Product.nama_produk == pd["nama"]).first()
            if not p:
                p = Product(
                    id=uuid.uuid4(),
                    nama_produk=pd["nama"],
                    kategori=pd["kategori"],
                    harga=pd["harga"],
                    stok_ball=pd["stok"],
                    is_active=True,
                )
                db.add(p)
                print(f"  ✅ Produk: {pd['nama']} (stok: {pd['stok']})")
            prod_records[pd["nama"]] = p
        db.flush()

        # === ORDERS ===
        if db.query(Order).count() == 0:
            buyer0 = buyer_records[0]  # Toko Makmur
            roti_coklat = prod_records["Roti Coklat"]
            roti_keju = prod_records["Roti Keju"]

            order1 = Order(
                id=uuid.uuid4(),
                buyer_id=buyer0.id,
                status="delivered",
                total_tagihan=75000,
                total_potongan_retur=15000,
                grand_total=60000,
                catatan="Titip salam dari pak RT",
            )
            db.add(order1)
            db.flush()

            item1 = OrderItem(
                id=uuid.uuid4(),
                order_id=order1.id,
                product_id=roti_coklat.id,
                qty=3,
                harga_satuan=15000,
                subtotal=45000,
                estimasi_expired=date.today() + timedelta(days=2),  # akan expired 2 hari lagi
                status_retur="perlu_ditarik",
                qty_retur=1,
                alasan_retur="Roti sedikit penyok",
            )
            item2 = OrderItem(
                id=uuid.uuid4(),
                order_id=order1.id,
                product_id=roti_keju.id,
                qty=2,
                harga_satuan=17000,
                subtotal=34000,
                estimasi_expired=date.today() + timedelta(days=1),  # besok expired!
            )
            db.add_all([item1, item2])
            print("  ✅ Order sample untuk Toko Makmur")

        # === PRE-ORDERS ===
        if db.query(PreOrder).count() == 0:
            roti_abon = prod_records["Roti Abon"]
            buyer1 = buyer_records[1]  # Warung Barokah
            buyer2 = buyer_records[2]  # Toko Sejahtera

            po1 = PreOrder(
                id=uuid.uuid4(),
                buyer_id=buyer1.id,
                product_id=roti_abon.id,
                qty_request=5,
                status="pending",
            )
            po2 = PreOrder(
                id=uuid.uuid4(),
                buyer_id=buyer2.id,
                product_id=roti_abon.id,
                qty_request=3,
                status="pending",
            )
            db.add_all([po1, po2])
            print("  ✅ Pre-order sample untuk Roti Abon (stok 0)")

        db.commit()
        print("\n🎉 Seed selesai!")
        print("=" * 40)
        print("Login Admin  : admin1 / admin123")
        print("Login Sales  : sales1 / sales123")
        print("Login Buyer  : toko_makmur / buyer123")
        print("Login Buyer  : warung_barokah / buyer123")
        print("Login Buyer  : toko_sejahtera / buyer123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
