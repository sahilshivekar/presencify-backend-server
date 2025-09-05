import Joi from 'joi';

const loginStudent = {
	body: Joi.object().keys({
		emailOrPRN: Joi.string().required().messages({ 'any.required': 'Email or PRN is required' }),
		password: Joi.string().min(8).max(128).required().messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 8 characters', 'string.max': 'Password cannot exceed 128 characters' })
	})
};

const sendVerificationCodeToEmail = {
	body: Joi.object().keys({ email: Joi.string().email().required().messages({ 'any.required': 'Email is required', 'string.email': 'Please provide a valid email address' }) })
};

const getAccessToken = {
	body: Joi.object().keys({ refreshToken: Joi.string().required().messages({ 'any.required': 'Refresh token is required' }) })
};

const updateStudentPassword = {
	body: Joi.object().keys({
		password: Joi.string().min(8).max(128).required().messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 8 characters', 'string.max': 'Password cannot exceed 128 characters' }),
		confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Password and confirm password must match', 'any.required': 'Confirm password is required' })
	})
};

const verifyCode = {
	body: Joi.object().keys({
		email: Joi.string().email().required().messages({ 'any.required': 'Email is required', 'string.email': 'Please provide a valid email address' }),
		code: Joi.string().length(6).required().messages({ 'any.required': 'Code is required', 'string.length': 'Code must be 6 characters long' })
	})
};

export default {
	loginStudent,
	sendVerificationCodeToEmail,
	getAccessToken,
	updateStudentPassword,
	verifyCode
};


