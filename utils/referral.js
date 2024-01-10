const User = require('../models/userModel');

function generateReferralCode() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        referralCode += charset[randomIndex];
    }
    return referralCode;
}

const referralCode = async () => {
    const referral = generateReferralCode()
    const codeExist = await User.findOne({ referralCode: referral })
    if (codeExist) referralCode()
    return referral;
}

module.exports = referralCode;