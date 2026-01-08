/**
 * Simple LocalStorage Database for Minna Store
 * Handles Users, Products, Cart, and Orders
 */

const DB_KEYS = {
    USERS: 'minna_users',
    CURRENT_USER: 'minna_current_user',
    PRODUCTS: 'minna_products',
    ORDERS: 'minna_orders'
};

// Initialize Products if empty
const initialProducts = [
    { id: 1, name: 'طماطم', category: 'المواد الغذائية', price: 500, image: '🍅' },
    { id: 2, name: 'بطاطس', category: 'المواد الغذائية', price: 700, image: '🥔' },
    { id: 3, name: 'شامبو', category: 'العناية الشخصية', price: 1500, image: '🧴' },
    { id: 4, name: 'صابون', category: 'العناية الشخصية', price: 300, image: '🧼' },
    { id: 5, name: 'مسحوق غسيل', category: 'المنظفات', price: 2000, image: '🧹' },
    { id: 6, name: 'عصير برتقال', category: 'المشروبات', price: 400, image: '🥤' },
    { id: 7, name: 'بسكويت', category: 'الحلويات', price: 200, image: '🍪' },
    { id: 8, name: 'فلفل أسود', category: 'التوابل والبهارات', price: 600, image: '🧂' }
];

if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(initialProducts));
}

const db = {
    // User Management
    registerUser: (userData) => {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        
        // Check if email or phone already exists
        if (users.find(u => u.email === userData.email || u.phone === userData.phone)) {
            return { success: false, message: 'المستخدم موجود بالفعل (البريد الإلكتروني أو الهاتف)' };
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            cart: [] // Initialize empty cart for user
        };

        users.push(newUser);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        
        // Auto login after register
        db.loginUser(userData.email, userData.password);
        
        return { success: true, message: 'تم التسجيل بنجاح' };
    },

    loginUser: (email, password) => {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            return { success: true, message: 'تم تسجيل الدخول بنجاح' };
        }
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    },

    logoutUser: () => {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
        window.location.href = 'login.html';
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER));
    },

    // Product Management
    getProducts: () => {
        return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
    },

    // Cart Management
    addToCart: (productId, quantity = 1) => {
        const currentUser = db.getCurrentUser();
        if (!currentUser) {
            alert('يرجى تسجيل الدخول أولاً لإضافة منتجات للسلة');
            window.location.href = 'login.html';
            return;
        }

        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex !== -1) {
            const user = users[userIndex];
            const existingItemIndex = user.cart.findIndex(item => item.productId === productId);

            if (existingItemIndex !== -1) {
                user.cart[existingItemIndex].quantity += quantity;
            } else {
                const product = db.getProducts().find(p => p.id === productId);
                if (product) {
                    user.cart.push({
                        productId,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity
                    });
                }
            }

            // Update storage
            users[userIndex] = user;
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            
            // Update current user session
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            
            alert('تمت الإضافة للسلة');
        }
    },

    getCart: () => {
        const currentUser = db.getCurrentUser();
        return currentUser ? currentUser.cart : [];
    },

    removeFromCart: (productId) => {
        const currentUser = db.getCurrentUser();
        if (!currentUser) return;

        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex !== -1) {
            const user = users[userIndex];
            user.cart = user.cart.filter(item => item.productId !== productId);

            users[userIndex] = user;
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            
            return true; // Success
        }
        return false;
    },

    clearCart: () => {
        const currentUser = db.getCurrentUser();
        if (!currentUser) return;

        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex !== -1) {
            const user = users[userIndex];
            user.cart = [];

            users[userIndex] = user;
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
        }
    },

    // Order Management
    placeOrder: () => {
        const currentUser = db.getCurrentUser();
        if (!currentUser || currentUser.cart.length === 0) {
            return { success: false, message: 'السلة فارغة' };
        }

        const orders = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
        
        const newOrder = {
            id: Date.now(),
            userId: currentUser.id,
            userName: currentUser.name,
            userPhone: currentUser.phone,
            items: [...currentUser.cart],
            total: currentUser.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            date: new Date().toISOString(),
            status: 'pending' // pending, completed, cancelled
        };

        orders.push(newOrder);
        localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

        // Clear cart after order
        db.clearCart();

        return { success: true, message: 'تم إرسال الطلب بنجاح' };
    },

    getUserOrders: () => {
        const currentUser = db.getCurrentUser();
        if (!currentUser) return [];
        
        const orders = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
        return orders.filter(order => order.userId === currentUser.id);
    }
};
