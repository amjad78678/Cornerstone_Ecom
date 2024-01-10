const Order = require('../models/orderModel');

function generateOrderId() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let orderId = '';
    for (let i = 0; i < 7; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        orderId += charset[randomIndex];
    }
    return orderId;
}

const orderId = async () => {
    const generatedOrderId = generateOrderId();
    const codeExist = await Order.findOne({ order_id: generatedOrderId });

    if (codeExist) {
        // If the order ID already exists, generate a new one by calling orderId() recursively.
        return orderId();
    }

    // If the order ID doesn't exist, return the generated order ID.
    return generatedOrderId;
}

module.exports = orderId;
