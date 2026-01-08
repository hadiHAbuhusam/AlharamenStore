from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3

app = Flask(__name__)
app.secret_key = 'your_secret_key'

def get_db_connection():
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form['username'] == 'admin' and request.form['password'] == 'adminpass':
            session['admin'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return 'Invalid credentials'
    return '''
        <form method="post">
            Username: <input name="username"><br>
            Password: <input name="password" type="password"><br>
            <input type="submit" value="Login">
        </form>
    '''

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders').fetchall()
    conn.close()
    html = '<h1>Admin Order Management</h1><table border="1">'
    html += '<tr><th>ID</th><th>Client</th><th>Date</th><th>Status</th><th>Items</th><th>Total</th><th>Actions</th></tr>'
    for order in orders:
        html += f"<tr><td>{order['order_id']}</td><td>{order['client_name']}</td><td>{order['order_date']}</td><td>{order['status']}</td><td>{order['items']}</td><td>{order['total_amount']}</td>"
        html += f"<td><a href='/admin/update/{order['order_id']}'>Update</a> | <a href='/admin/delete/{order['order_id']}'>Delete</a></td></tr>"
    html += '</table>'
    return html

@app.route('/admin/update/<int:order_id>', methods=['GET', 'POST'])
def update_order(order_id):
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    conn = get_db_connection()
    if request.method == 'POST':
        status = request.form['status']
        conn.execute('UPDATE orders SET status = ? WHERE order_id = ?', (status, order_id))
        conn.commit()
        conn.close()
        return redirect(url_for('admin_dashboard'))
    order = conn.execute('SELECT * FROM orders WHERE order_id = ?', (order_id,)).fetchone()
    conn.close()
    return f'''
        <form method="post">
            Update Status for Order {order_id}: <input name="status" value="{order['status']}"><br>
            <input type="submit" value="Update">
        </form>
    '''

@app.route('/admin/delete/<int:order_id>')
def delete_order(order_id):
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    conn = get_db_connection()
    conn.execute('DELETE FROM orders WHERE order_id = ?', (order_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_dashboard'))

if __name__ == '__main__':
    app.run(debug=True)