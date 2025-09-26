const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        message: err.message || 'Internal Server Error',
        statusCode: err.statusCode || 500,
        code: err.code || 'INTERNAL_ERROR'
    };

    // Mongoose/Database validation errors
    if (err.name === 'ValidationError') {
        error.message = Object.values(err.errors).map(val => val.message).join(', ');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
    }

    // SQLite constraint errors
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error.message = 'Duplicate entry found';
        error.statusCode = 409;
        error.code = 'DUPLICATE_ENTRY';
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        error.message = 'Referenced record not found';
        error.statusCode = 400;
        error.code = 'FOREIGN_KEY_ERROR';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.statusCode = 401;
        error.code = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.statusCode = 401;
        error.code = 'TOKEN_EXPIRED';
    }

    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File too large';
        error.statusCode = 413;
        error.code = 'FILE_TOO_LARGE';
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = 'Unexpected file field';
        error.statusCode = 400;
        error.code = 'UNEXPECTED_FILE';
    }

    // Custom API errors
    if (err.isApiError) {
        error = err;
    }

    // Don't expose sensitive error details in production
    if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
        error.message = 'Internal Server Error';
        error.details = undefined;
    }

    // Send error response
    const response = {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        path: req.path
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = err.details;
    }

    res.status(error.statusCode).json(response);
};

// Custom API Error class
class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'API_ERROR', details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isApiError = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Async wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    ApiError,
    asyncHandler
};