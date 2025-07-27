import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../interfaces/chat.types';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const createError = (message: string, statusCode: number = 500): AppError => {
    return new AppError(message, statusCode);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};

export const globalErrorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = { ...err } as AppError;
    error.message = err.message;

    // Log error
    console.error('❌ Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Default error values
    let statusCode = 500;
    let message = 'Internal Server Error';

    // Handle known AppError instances
    if (error.isOperational) {
        statusCode = error.statusCode;
        message = error.message;
    }
    // Handle Multer errors
    else if (err.message && err.message.includes('LIMIT_FILE_SIZE')) {
        statusCode = 400;
        message = 'File size too large. Please upload a file smaller than 10MB.';
    }
    else if (err.message && err.message.includes('LIMIT_UNEXPECTED_FILE')) {
        statusCode = 400;
        message = 'Unexpected file field. Please use "pricingFile" field for uploads.';
    }
    // Handle Axios errors (API calls)
    else if (err.message && err.message.includes('ECONNREFUSED')) {
        statusCode = 503;
        message = 'External service unavailable. Please try again later.';
    }
    // Handle validation errors
    else if (err.message && err.message.includes('validation')) {
        statusCode = 400;
        message = err.message;
    }

    const errorResponse: ErrorResponse = {
        success: false,
        error: 'Error',
        message,
        statusCode
    };

    res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    const errorResponse: ErrorResponse = {
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        statusCode: 404
    };

    res.status(404).json(errorResponse);
};

// Alias for backward compatibility
export const errorHandler = globalErrorHandler;
