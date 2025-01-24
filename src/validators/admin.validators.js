import Joi from 'joi'
import { ApiError } from '../utils/ApiError.js';

const getAdminsSchema = Joi.object({
    sortBy: Joi
        .string()
        .valid('username', 'email', 'createdAt', 'updatedAt')
        .default('createdAt')
        .messages({
            'any.only': `Invalid value for 'sortBy' parameter. Valid parameters are 'username', 'email', 'createdAt', and 'updatedAt'.`,
        }),
    sortOrder: Joi
        .string()
        .valid('ASC', 'DESC')
        .default('ASC')
        .messages({
            'any.only': `Invalid value for 'sortOrder' parameter. Valid parameters are 'ASC' and 'DESC'.`,
        }),
    searchQuery: Joi
        .string()
        .default('')
        .allow('', null)
        .messages({
            'any.only': `Value for 'searchQuery' parameter must be a string.`,
        }),
    page: Joi.string()
        .default('1')
        .custom((value) => {
            const page = parseInt(value, 10);
            if (isNaN(page)) {
                throw new ApiError(400, 'Page must be a valid number');
            } else if (page < 1) {
                throw new ApiError(400, 'Page must be greater than 0')
            }
            return page;
        })
        .messages({
            'any.only': `Value for 'page' parameter must be a number passed as string.`,
        }),
    limit: Joi.string()
        .default('10')
        .custom((value) => {
            const limit = parseInt(value, 10);
            if (isNaN(limit)) {
                throw new ApiError(400, 'Limit must be a valid number');
            } else if (limit < 1) {
                throw new Error(400, 'Limit must be greater than 0')
            }
            return limit;
        })
        .messages({
            'any.only': `Value for 'limit' parameter must be a number passed as string.`,
        }),
})


const emailSchema = Joi.object({
    email: Joi
        .string()
        .email()
        .optional()
        .error(new ApiError(400, "Enter a valid email"))
})
export {
    getAdminsSchema,
    emailSchema
}