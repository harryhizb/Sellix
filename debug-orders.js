const mongoose = require('mongoose');
const { Order } = require('./src/models/Order');
const { User } = require('./src/models/User');

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp-saas');

    const orders = await Order.find().limit(10).lean();
    console.log('--- LATEST 10 ORDERS ---');
    for (const o of orders) {
        console.log(`Order: ${o._id} | Business: ${o.businessId} | Customer: ${o.customerId}`);
    }

    const users = await User.find().lean();
    console.log('\n--- SYSTEM USERS ---');
    for (const u of users) {
        console.log(`User: ${u.email} | Business: ${u.businessId} | Auth: ${u.authProvider}`);
    }

    process.exit(0);
}

run();
