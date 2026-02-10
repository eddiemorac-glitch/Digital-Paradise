import psycopg2

def check_mapping():
    try:
        conn = psycopg2.connect(
            host="127.0.0.1",
            database="caribe_digital",
            user="postgres",
            password="sentinel2024"
        )
        cur = conn.cursor()
        
        print("--- USERS ---")
        cur.execute("SELECT id, email, role FROM users WHERE email IN ('comercio@caribe.com', 'cliente@caribe.com', 'repartidor@caribe.com')")
        users = cur.fetchall()
        for u in users:
            print(f"ID: {u[0]} | Email: {u[1]} | Role: {u[2]}")
            
        print("\n--- MERCHANTS ---")
        cur.execute("SELECT id, name, \"userId\" FROM merchants")
        merchants = cur.fetchall()
        for m in merchants:
            print(f"ID: {m[0]} | Name: {m[1]} | UserId: {m[2]}")
            
        print("\n--- FIXING MAPPING ---")
        cur.execute("SELECT id FROM users WHERE email = 'comercio@caribe.com'")
        user_row = cur.fetchone()
        if user_row and len(user_row) > 0:
            user_id = user_row[0]
            cur.execute("UPDATE merchants SET \"userId\" = %s WHERE name LIKE '%Bread%'", (user_id,))
            conn.commit()
            print(f"✅ Linked user {user_id} to Bread & Chocolate")
        else:
            print("❌ User comercio@caribe.com not found in users table")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_mapping()
