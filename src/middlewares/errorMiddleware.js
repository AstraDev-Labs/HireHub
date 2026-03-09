const AppError = require('../utils/AppError');

const handleDynamoDBValidationError = (err) => new AppError(`Invalid input data: ${err.message}`, 400);
const handleDynamoDBConditionalError = () => new AppError('The operation could not be completed due to a conflict.', 409);
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
    console.error('ERROR 💥', err);
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

module.exports = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'Validation_error') error = handleDynamoDBValidationError(error);
        if (error.code === 'ConditionalCheckFailedException') error = handleDynamoDBConditionalError(error);
        if (error.name === 'JsonWebToken_error') error = handleJWTError();
        if (error.name === 'TokenExpired_error') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};


