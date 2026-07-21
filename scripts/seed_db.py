import sqlite3
import random
from datetime import datetime, timedelta

def create_database():
    conn = sqlite3.connect('data/caesar.db')
    c = conn.cursor()

    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            quarter TEXT,
            year INTEGER,
            month INTEGER,
            region TEXT,
            category TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT,
            signup_date TEXT,
            region TEXT,
            plan_type TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            rating INTEGER,
            comment TEXT,
            category TEXT,
            created_at TEXT,
            FOREIGN KEY(customer_id) REFERENCES customers(id)
        )
    ''')

    conn.commit()
    return conn

def seed_data(conn):
    c = conn.cursor()

    # Clear existing data
    c.execute("DELETE FROM sales")
    c.execute("DELETE FROM customers")
    c.execute("DELETE FROM feedback")

    # Seed customers
    regions = ['North', 'South', 'East', 'West', 'Central']
    statuses = ['active', 'inactive', 'pending']
    plan_types = ['basic', 'premium', 'enterprise']

    start_date = datetime(2022, 1, 1)
    for i in range(1, 201):  # 200 customers
        status = random.choice(statuses)
        # random signup date between 2022-01-01 and 2024-12-31
        days_offset = random.randint(0, 365*2)
        signup_date = start_date + timedelta(days=days_offset)
        region = random.choice(regions)
        plan_type = random.choice(plan_types)

        c.execute("INSERT INTO customers (id, status, signup_date, region, plan_type) VALUES (?, ?, ?, ?, ?)",
                  (i, status, signup_date.strftime('%Y-%m-%d'), region, plan_type))

    # Seed sales for 2 years (2023 and 2024) with monthly data
    categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Electronics']
    for year in [2023, 2024]:
        for month in range(1, 13):
            quarter = f"Q{(month-1)//3 + 1}"
            # Generate some sales data for each region and category
            for region in regions:
                for category in categories:
                    # Generate a random number of sales transactions per month per region per category
                    num_transactions = random.randint(5, 20)
                    for _ in range(num_transactions):
                        amount = round(random.uniform(10.0, 1000.0), 2)
                        c.execute("INSERT INTO sales (amount, quarter, year, month, region, category) VALUES (?, ?, ?, ?, ?, ?)",
                                  (amount, quarter, year, month, region, category))

    # Seed feedback for some customers
    for customer_id in range(1, 201):
        # Not every customer gives feedback
        if random.random() < 0.3:  # 30% of customers leave feedback
            rating = random.randint(1, 5)
            comment = random.choice([
                "Great service!",
                "Could be better.",
                "Average experience.",
                "Excellent product.",
                "Needs improvement.",
                "Satisfactory.",
                "Exceeded expectations.",
                "Not what I expected."
            ])
            category = random.choice(["Electronics", "Clothing", "Food", "Books", "Service"])
            days_ago = random.randint(0, 365)
            created_at = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S')
            c.execute("INSERT INTO feedback (customer_id, rating, comment, category, created_at) VALUES (?, ?, ?, ?, ?)",
                      (customer_id, rating, comment, category, created_at))

    conn.commit()
    conn.close()
    print("Database seeded successfully.")

if __name__ == '__main__':
    conn = create_database()
    seed_data(conn)