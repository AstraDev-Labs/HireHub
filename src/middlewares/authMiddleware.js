const User = require('../models/User');
const AppError = require('../utils/AppError');
require('dotenv').config();

exports.protect = async (req, res, next) => {
  try {
    // We expect requests to be proxied by Next.js, which validates the session
    // and sends x-internal-secret and x-user-auth0-id headers.
    const internalSecret = req.headers['x-internal-secret'];
    const auth0Id = req.headers['x-user-auth0-id'];
    
    if (!internalSecret || internalSecret !== process.env.AUTH0_SECRET) {
      return next(new AppError('Unauthorized. Invalid or missing internal secret.', 401));
    }
    
    if (!auth0Id) {
      return next(new AppError('Unauthorized. Missing user ID.', 401));
    }
    
    // Find the user in MongoDB using the Auth0 ID
    const user = await User.findOne({ auth0_id: auth0Id });
    
    if (!user) {
      return next(new AppError('User profile not synced to database yet.', 401));
    }
    
    // Attach the user (and their roles) to the request!
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
