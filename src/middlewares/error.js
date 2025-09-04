import httpStatus from 'http-status';
import {config} from '../config/config.js';
import {logger} from '../config/logger.js';
import {ApiError} from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const errorConverter = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message, [], err.stack);
    }
    next(error);
};


const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (config.env === 'production' && !err.isOperational) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }

    res.locals.errorMessage = err.message;

    if (config.env === 'development') {
        logger.error(err);
    }

    res
        .status(statusCode)
        .json(
            new ApiError(
                statusCode,
                message,
                [],
                config.env === 'development' ? err.stack : undefined
            ))
};

export { errorConverter, errorHandler };
