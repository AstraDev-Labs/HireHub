/**
 * Strips sensitive fields from user objects before sending to client.
 * Use this in any controller that returns user data.
 */
function sanitizeUser(user) {
    if (!user) return null;

    const obj = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };

    // Remove sensitive fields
    delete obj.password;
    delete obj.refreshToken;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    delete obj.__v;

    return obj;
}

module.exports = sanitizeUser;
