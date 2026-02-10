import psycopg2

def list_merchants():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="caribe_digital_v2",
            user="postgres",
            password="caribe_master_2026"
        )
        cur = conn.cursor()
        cur.execute("SELECT name, status FROM merchants;")
        rows = cur.fetchall()
        for row in rows:
            print(f"{row[0]} | {row[1]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_merchants()
