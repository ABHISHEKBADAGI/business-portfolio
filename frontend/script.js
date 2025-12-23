const API_BASE_URL = 'http://localhost:3000/api';

let currentUser = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    initializeDatePicker();
    setupServiceCards();
});

function initializeDatePicker() {
    const today = new Date().toISOString().split('T')[0];
    const pickupDateInput = document.getElementById('pickup-date');
    if (pickupDateInput) {
        pickupDateInput.min = today;
        if (!pickupDateInput.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            pickupDateInput.value = tomorrow.toISOString().split('T')[0];
        }
    }
}

function setupServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const serviceTitle = this.querySelector('h3').textContent;
            showServiceDetails(serviceTitle);
        });
    });
}

function showServiceDetails(serviceName) {
    const serviceInfo = {
        'Dry Cleaning': {
            description: 'Professional dry cleaning for suits, dresses, and delicate fabrics using eco-friendly solvents.',
            price: '₹250/kg',
            time: '48 hours',
            includes: ['Stain removal', 'Steam pressing', 'Packaging', 'Quality check']
        },
        'Wash & Fold': {
            description: 'Everyday laundry washed, dried, and neatly folded for your convenience.',
            price: '₹150/kg',
            time: '24 hours',
            includes: ['Washing', 'Drying', 'Folding', 'Packaging']
        },
        'Special Care': {
            description: 'Special treatment for stains, delicate items, and special fabrics.',
            price: '₹300/kg',
            time: '72 hours',
            includes: ['Hand wash', 'Special detergents', 'Air drying', 'Careful handling']
        },
        'Express Service': {
            description: 'Get your clothes cleaned and delivered within 24 hours.',
            price: '+₹200',
            time: '24 hours',
            includes: ['Priority processing', 'Fast pickup', 'Quick delivery', 'Same day service']
        }
    };

    const service = serviceInfo[serviceName];
    if (!service) return;

    const modal = document.createElement('div');
    modal.className = 'service-modal';
    modal.innerHTML = `
        <div class="service-modal-content">
            <div class="service-modal-header">
                <h2>${serviceName}</h2>
                <span class="close-service-modal">&times;</span>
            </div>
            <div class="service-modal-body">
                <div class="service-detail">
                    <p class="service-description">${service.description}</p>
                    <div class="service-stats">
                        <div class="stat">
                            <i class="fas fa-tag"></i>
                            <div>
                                <span class="stat-label">Price</span>
                                <span class="stat-value">${service.price}</span>
                            </div>
                        </div>
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            <div>
                                <span class="stat-label">Turnaround Time</span>
                                <span class="stat-value">${service.time}</span>
                            </div>
                        </div>
                    </div>
                    <div class="service-includes">
                        <h4>Service Includes:</h4>
                        <ul>
                            ${service.includes.map(item => `<li><i class="fas fa-check-circle"></i> ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn-secondary close-service-btn">Close</button>
                    <button class="btn-primary book-this-service" data-service="${serviceName}">Book This Service</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    modal.querySelector('.close-service-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('.close-service-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('.book-this-service').addEventListener('click', () => {
        document.body.removeChild(modal);
        switchPage('book');
        
        setTimeout(() => {
            let serviceType = 'wash-fold';
            if (serviceName === 'Dry Cleaning') serviceType = 'dry-clean';
            if (serviceName === 'Express Service') {
                document.getElementById('express').checked = true;
            }
            
            document.querySelector(`input[value="${serviceType}"]`).checked = true;
            calculatePrice();
        }, 300);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showMainApp();
        loadUserData();
    } else {
        showAuthForms();
    }
}

function showAuthForms() {
    document.getElementById('auth-forms').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('auth-forms').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

function setupEventListeners() {
    setupAuthListeners();
    setupAppListeners();
}

function setupAuthListeners() {
    document.getElementById('login-tab').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('signup-tab').addEventListener('click', () => switchAuthTab('signup'));
    document.getElementById('switch-to-signup').addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthTab('signup');
    });
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthTab('login');
    });
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

function setupAppListeners() {
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            switchPage(page);
        });
    });
    
    document.getElementById('book-now-hero').addEventListener('click', () => switchPage('book'));
    
    document.getElementById('add-money-btn').addEventListener('click', openWalletModal);
    document.getElementById('add-money-profile').addEventListener('click', openWalletModal);
    document.getElementById('edit-profile-btn').addEventListener('click', openEditProfileModal);
    
    setupWalletModal();
    setupBookingForm();
    setupEditProfileModal();
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showMainApp();
        loadUserData();
        showNotification('Login successful!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const address = document.getElementById('signup-address').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                address,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showMainApp();
        loadUserData();
        showNotification('Account created successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    showAuthForms();
    showNotification('Logged out successfully', 'success');
}

function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    
    document.getElementById(`${page}-page`).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    if (page === 'orders') {
        loadOrders();
    } else if (page === 'profile') {
        loadProfile();
    } else if (page === 'book') {
        prefillBookingForm();
        calculatePrice();
    }
}

function loadUserData() {
    if (!currentUser) return;
    
    document.getElementById('wallet-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
    document.getElementById('profile-wallet-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
    
    document.getElementById('profile-fullname').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email;
    
    switchPage('home');
}

async function loadProfile() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            updateProfileDisplay(userData);
            loadTransactions();
        }
    } catch (error) {
        showNotification('Error loading profile', 'error');
    }
}

function updateProfileDisplay(userData) {
    document.getElementById('detail-name').textContent = userData.name;
    document.getElementById('detail-email').textContent = userData.email;
    document.getElementById('detail-phone').textContent = userData.phone;
    document.getElementById('detail-address').textContent = userData.address;
    document.getElementById('detail-join-date').textContent = new Date(userData.createdAt).toLocaleDateString('en-IN');
    
    document.getElementById('profile-wallet-balance').textContent = `₹${userData.walletBalance.toFixed(2)}`;
    document.getElementById('wallet-balance').textContent = `₹${userData.walletBalance.toFixed(2)}`;
    
    if (currentUser) {
        currentUser.walletBalance = userData.walletBalance;
        localStorage.setItem('user', JSON.stringify(currentUser));
    }
}

async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/transactions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '';
        
        if (response.ok) {
            const transactions = await response.json();
            
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
                return;
            }
            
            transactions.forEach(transaction => {
                const transactionItem = document.createElement('div');
                transactionItem.className = 'transaction-item';
                
                const amountClass = transaction.type === 'credit' ? 'positive' : 'negative';
                const amountSign = transaction.type === 'credit' ? '+' : '-';
                
                transactionItem.innerHTML = `
                    <div>
                        <strong>${transaction.description}</strong>
                        <p style="font-size: 0.9rem; color: #666;">${new Date(transaction.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div class="transaction-amount ${amountClass}">${amountSign}₹${transaction.amount.toFixed(2)}</div>
                `;
                
                transactionsList.appendChild(transactionItem);
            });
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const ordersList = document.getElementById('orders-list');
        
        if (response.ok) {
            const orders = await response.json();
            displayOrders(orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-box-open"></i>
                <h3>No Orders Yet</h3>
                <p>Book your first laundry service to get started!</p>
                <button class="btn-primary" id="book-first-order">Book Now</button>
            </div>
        `;
        document.getElementById('book-first-order').addEventListener('click', () => switchPage('book'));
        return;
    }
    
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        const serviceName = order.serviceType === 'dry-clean' ? 'Dry Cleaning' : 
                          order.serviceType === 'wash-fold' ? 'Wash & Fold' : 'Laundry Service';
        const expressText = order.express ? ' (Express)' : '';
        const statusClass = `status-${order.status ? order.status.toLowerCase() : 'scheduled'}`;
        const statusText = order.status || 'Scheduled';
        
        orderItem.innerHTML = `
            <h4>Order #${order._id.slice(-6)}
                <span class="order-status ${statusClass}">${statusText}</span>
            </h4>
            <div class="order-details">
                <div class="detail-column">
                    <p><strong>Service:</strong> ${serviceName}${expressText}</p>
                    <p><strong>Weight:</strong> ${order.weight} kg</p>
                    <p><strong>Amount:</strong> ₹${order.totalAmount || '0'}</p>
                </div>
                <div class="detail-column">
                    <p><strong>Pickup:</strong> ${order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('en-IN') : 'N/A'} at ${order.pickupTime || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.address ? order.address.substring(0, 50) : ''}${order.address && order.address.length > 50 ? '...' : ''}</p>
                    <p><strong>Placed on:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>
            </div>
        `;
        
        ordersList.appendChild(orderItem);
    });
}

function setupWalletModal() {
    const modal = document.getElementById('wallet-modal');
    const closeBtn = document.querySelector('.close');
    const addMoneyBtn = document.getElementById('add-to-wallet');
    const amountOptions = document.querySelectorAll('.amount-option');
    const customAmountInput = document.getElementById('custom-amount');
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    
    document.getElementById('add-money-btn').addEventListener('click', () => {
        document.getElementById('modal-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
        modal.style.display = 'block';
    });
    
    document.getElementById('add-money-profile').addEventListener('click', () => {
        document.getElementById('modal-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetWalletModal();
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetWalletModal();
        }
    });
    
    amountOptions.forEach(option => {
        option.addEventListener('click', function() {
            amountOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            customAmountInput.value = '';
        });
    });
    
    customAmountInput.addEventListener('input', function() {
        amountOptions.forEach(opt => opt.classList.remove('active'));
    });
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            const methodValue = this.value;
            
            document.querySelectorAll('.payment-details').forEach(detail => {
                detail.classList.add('hidden');
            });
            
            if (methodValue === 'card') {
                document.getElementById('card-payment-details').classList.remove('hidden');
            } else if (methodValue === 'upi') {
                document.getElementById('upi-payment-details').classList.remove('hidden');
            } else if (methodValue === 'netbanking') {
                document.getElementById('netbanking-payment-details').classList.remove('hidden');
            }
        });
    });
    
    addMoneyBtn.addEventListener('click', async function() {
        let amount = 0;
        
        const activeOption = document.querySelector('.amount-option.active');
        if (activeOption) {
            amount = parseFloat(activeOption.getAttribute('data-amount'));
        } else if (customAmountInput.value) {
            amount = parseFloat(customAmountInput.value);
        }
        
        if (!amount || amount < 100) {
            showNotification('Minimum amount to add is ₹100', 'error');
            return;
        }
        
        if (amount > 10000) {
            showNotification('Maximum amount to add is ₹10,000', 'error');
            return;
        }
        
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/add-money`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    amount,
                    paymentMethod
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add money');
            }
            
            if (currentUser) {
                currentUser.walletBalance = data.newBalance;
                localStorage.setItem('user', JSON.stringify(currentUser));
            }
            
            updateWalletDisplay();
            loadTransactions();
            
            showNotification(`Successfully added ₹${amount.toFixed(2)} to your wallet!`, 'success');
            
            modal.style.display = 'none';
            resetWalletModal();
            
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

function resetWalletModal() {
    document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('active'));
    document.getElementById('custom-amount').value = '';
    document.getElementById('modal-card-number').value = '';
    document.getElementById('modal-card-expiry').value = '';
    document.getElementById('modal-card-cvv').value = '';
    document.getElementById('modal-upi-id').value = '';
    document.getElementById('bank-select').value = '';
}

function updateWalletDisplay() {
    if (currentUser) {
        document.getElementById('wallet-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
        document.getElementById('profile-wallet-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
        document.getElementById('modal-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
    }
}

function setupBookingForm() {
    const serviceTypeRadios = document.querySelectorAll('input[name="service"]');
    const weightInput = document.getElementById('weight');
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const expressRadio = document.querySelector('input[value="express"]');
    
    serviceTypeRadios.forEach(radio => {
        radio.addEventListener('change', calculatePrice);
    });
    
    weightInput.addEventListener('input', calculatePrice);
    
    if (expressRadio) {
        expressRadio.addEventListener('change', calculatePrice);
    }
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            document.querySelectorAll('.payment-details').forEach(detail => {
                detail.classList.add('hidden');
            });
            
            if (this.value === 'card') {
                document.getElementById('card-details').classList.remove('hidden');
            } else if (this.value === 'upi') {
                document.getElementById('upi-details').classList.remove('hidden');
            }
        });
    });
    
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
    
    calculatePrice();
}

function prefillBookingForm() {
    if (!currentUser) return;
    
    document.getElementById('name').value = currentUser.name;
    document.getElementById('phone').value = currentUser.phone;
    document.getElementById('address').value = currentUser.address;
    
    initializeDatePicker();
}

function calculatePrice() {
    try {
        const selectedService = document.querySelector('input[name="service"]:checked').value;
        const weight = parseInt(document.getElementById('weight').value) || 1;
        const expressSelected = document.querySelector('input[value="express"]').checked;
        
        const servicePrices = {
            'dry-clean': 250,
            'wash-fold': 150
        };
        
        let serviceCost = 0;
        let expressCharge = 0;
        
        if (selectedService === 'dry-clean') {
            serviceCost = servicePrices['dry-clean'] * weight;
        } else if (selectedService === 'wash-fold') {
            serviceCost = servicePrices['wash-fold'] * weight;
        }
        
        if (expressSelected) {
            expressCharge = 200;
        }
        
        const totalAmount = serviceCost + expressCharge;
        
        document.getElementById('service-cost').textContent = `₹${serviceCost}`;
        document.getElementById('express-charge').textContent = `₹${expressCharge}`;
        document.getElementById('total-amount').textContent = `₹${totalAmount}`;
        document.getElementById('confirm-amount').textContent = totalAmount;
        
    } catch (error) {
        console.error('Error calculating price:', error);
    }
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to book a service', 'error');
        return;
    }
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const pickupDate = document.getElementById('pickup-date').value;
    const pickupTime = document.getElementById('pickup-time').value;
    const weight = document.getElementById('weight').value;
    const serviceType = document.querySelector('input[name="service"]:checked').value;
    const express = document.querySelector('input[value="express"]').checked;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (!pickupTime) {
        showNotification('Please select a pickup time', 'error');
        return;
    }
    
    const weightNum = parseInt(weight);
    const servicePrices = {
        'dry-clean': 250,
        'wash-fold': 150
    };
    
    let serviceCost = 0;
    let expressCharge = 0;
    
    if (serviceType === 'dry-clean') {
        serviceCost = servicePrices['dry-clean'] * weightNum;
    } else if (serviceType === 'wash-fold') {
        serviceCost = servicePrices['wash-fold'] * weightNum;
    }
    
    if (express) {
        expressCharge = 200;
    }
    
    const totalAmount = serviceCost + expressCharge;
    
    if (paymentMethod === 'wallet' && currentUser.walletBalance < totalAmount) {
        showNotification(`Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${currentUser.walletBalance.toFixed(2)}`, 'error');
        openWalletModal();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                phone,
                address,
                pickupDate,
                pickupTime,
                serviceType,
                weight: weightNum,
                express,
                totalAmount,
                paymentMethod
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Booking failed');
        }
        
        if (paymentMethod === 'wallet' && data.newBalance !== undefined) {
            currentUser.walletBalance = data.newBalance;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateWalletDisplay();
        }
        
        showNotification('Booking confirmed successfully!', 'success');
        
        document.getElementById('booking-form').reset();
        prefillBookingForm();
        calculatePrice();
        
        setTimeout(() => {
            loadOrders();
            switchPage('orders');
        }, 1000);
        
    } catch (error) {
        showNotification(error.message || 'Server error. Please try again.', 'error');
    }
}

function openWalletModal() {
    const modal = document.getElementById('wallet-modal');
    document.getElementById('modal-balance').textContent = `₹${currentUser.walletBalance.toFixed(2)}`;
    modal.style.display = 'block';
}

function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (!currentUser) return;
    
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-phone').value = currentUser.phone;
    document.getElementById('edit-address').value = currentUser.address;
    modal.style.display = 'block';
}

function setupEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    const closeBtn = document.querySelector('.close-edit');
    const editForm = document.getElementById('edit-profile-form');
    
    document.getElementById('edit-profile-btn').addEventListener('click', openEditProfileModal);
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('edit-name').value;
        const phone = document.getElementById('edit-phone').value;
        const address = document.getElementById('edit-address').value;
        const password = document.getElementById('edit-password').value;
        const confirmPassword = document.getElementById('edit-confirm-password').value;
        
        if (password && password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (!validatePhone(phone)) {
            showNotification('Please enter a valid phone number', 'error');
            return;
        }
        
        try {
            const updateData = { name, phone, address };
            if (password) {
                updateData.password = password;
            }
            
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(updateData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Update failed');
            }
            
            currentUser = { ...currentUser, ...data.user };
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            updateProfileDisplay(currentUser);
            prefillBookingForm();
            
            showNotification('Profile updated successfully!', 'success');
            modal.style.display = 'none';
            
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

function showNotification(message, type) {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}