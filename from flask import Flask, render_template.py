from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import secrets
import smtplib

app = Flask(__name__)
app.secret_key = 'your_secret_key'

def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

# --- User Registration ---
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        conn = get_db_connection()
        conn.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, password))
        conn.commit()
        conn.close()
        flash('Registration successful. Please log in.')
        return redirect(url_for('login'))
    return render_template('registeration.html')

# --- User Login ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password)).fetchone()
        conn.close()
        if user:
            session['user_id'] = user['id']
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid credentials')
    return render_template('login.html')

# --- Forgot Password ---
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        token = secrets.token_urlsafe(32)
        conn = get_db_connection()
        conn.execute('UPDATE users SET reset_token = ? WHERE email = ?', (token, email))
        conn.commit()
        conn.close()
        # Send email (placeholder, replace with real email sending)
        print(f"Reset link: http://localhost:5000/reset-password?token={token}")
        flash('Password reset link sent to your email.')
        return redirect(url_for('login'))
    return render_template('forgot_password.html')

# --- Reset Password ---
@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    token = request.args.get('token') or request.form.get('token')
    if request.method == 'POST':
        new_password = request.form['new_password']
        conn = get_db_connection()
        conn.execute('UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?', (new_password, token))
        conn.commit()
        conn.close()
        flash('Password reset successful. Please log in.')
        return redirect(url_for('login'))
    return render_template('reset_password.html', token=token)

# --- OAuth Placeholders ---
@app.route('/auth/google')
def auth_google():
    # Implement Google OAuth here
    return "Google OAuth not implemented."

@app.route('/auth/facebook')
def auth_facebook():
    # Implement Facebook OAuth here
    return "Facebook OAuth not implemented."

# --- Dashboard (protected) ---
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return "Welcome to your dashboard!"

if __name__ == '__main__':
    # Create users table if not exists
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            reset_token TEXT
        )
    ''')
    conn.close()
    app.run(debug=True)

# To set up the environment, run the following commands in your terminal:
# python -m venv venv
# venv\Scripts\activate
# pip install flask
# python -m ensurepip --upgrade