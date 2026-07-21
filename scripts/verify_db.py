import sqlite3

conn = sqlite3.connect('data/caesar.db')
c = conn.cursor()

tables = ['sales', 'customers', 'feedback']
for table in tables:
    c.execute(f"SELECT COUNT(*) FROM {table}")
    count = c.fetchone()[0]
    print(f"{table}: {count} rows")

    # Show one sample row
    c.execute(f"SELECT * FROM {table} LIMIT 1")
    row = c.fetchone()
    print(f"  Sample: {row}")

conn.close()