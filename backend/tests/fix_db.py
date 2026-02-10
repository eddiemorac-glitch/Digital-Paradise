import psycopg2

def fix():
    try:
        conn = psycopg2.connect(
            host="127.0.0.1",
            database="caribe_digital",
            user="postgres",
            password="sentinel2024"
        )
        cur = conn.cursor()
        
        print("--- FIX START ---")
        
        # 1. Get User ID
        print("🔍 Searching for comercio@caribe.com...")
        cur.execute("SELECT id FROM users WHERE email = 'comercio@caribe.com'")
        u_row = cur.fetchone()
        if not u_row:
            print("❌ User NOT FOUND. Listing all users:")
            cur.execute("SELECT email, role FROM users")
            for r in cur.fetchall():
                print(f"   - {r[0]} ({r[1]})")
            return

        u_id = u_row[0]
        print(f"✅ Found User: {u_id}")

        # 2. Update Merchant
        print("🔍 Searching for Bread & Chocolate...")
        cur.execute("SELECT id, name FROM merchants WHERE name ILIKE '%Bread%'")
        m_row = cur.fetchone()
        if not m_row:
            print("❌ Merchant NOT FOUND. Listing all merchants:")
            cur.execute("SELECT name FROM merchants")
            for r in cur.fetchall():
                print(f"   - {r[0]}")
            return

        m_id = m_row[0]
        print(f"✅ Found Merchant: {m_id} ({m_row[1]})")

        print(f"🔗 Linking {u_id} -> {m_id}")
        cur.execute("UPDATE merchants SET \"userId\" = %s WHERE id = %s", (u_id, m_id))
        
        # 3. Verify Courier
        cur.execute("UPDATE users SET \"courierStatus\" = 'VERIFIED' WHERE email = 'repartidor@caribe.com'")
        
        conn.commit()
        print("🌟 DATABASE FIXED 🌟")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"💥 ERROR: {e}")

if __name__ == "__main__":
    fix()
