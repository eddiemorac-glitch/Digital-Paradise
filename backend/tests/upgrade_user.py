import psycopg2
import os

def upgrade_user_to_merchant(email, merchant_name):
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="caribe_digital",
            user="postgres",
            password="sentinel2024"
        )
        cur = conn.cursor()
        
        # 1. Update User Role
        print(f"Upgrading user {email} to MERCHANT role...")
        cur.execute("UPDATE users SET role = 'merchant' WHERE email = %s RETURNING id", (email,))
        user_id = cur.fetchone()[0]
        
        # 2. Link Merchant and Activate
        print(f"Linking and activating merchant {merchant_name} to user {user_id}...")
        cur.execute("UPDATE merchants SET \"userId\" = %s, status = 'active' WHERE name = %s", (user_id, merchant_name))
        
        conn.commit()
        cur.close()
        conn.close()
        print("DONE: User upgraded and linked successfully.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        upgrade_user_to_merchant(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python upgrade_user.py <email> <merchant_name>")
