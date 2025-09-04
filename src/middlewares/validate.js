import Joi from 'joi';
import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import { ApiError } from '../utils/ApiError.js';

const validate = (schema) => (req, _, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: true })
        .validate(object);

    if (error) {
        const errorMessage = "Validation Error"
        const errors = error.details.map((details) => details.message);
        return next(
            new ApiError(
                httpStatus.BAD_REQUEST,
                errorMessage,
                errors
            ));
    }
    Object.assign(req, value);
    return next();
};

export default validate;