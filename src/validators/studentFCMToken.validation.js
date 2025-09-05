import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const addStudentFCMTokens = {
	body: Joi.object().keys({
		studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }),
		fcmToken: Joi.string().min(10).required().messages({ 'any.required': 'FCM token is required', 'string.min': 'FCM token must be at least 10 characters' })
	})
};

const updateStudentFCMTokens = {
	body: Joi.object().keys({
		studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }),
		fcmToken: Joi.string().min(10).required().messages({ 'any.required': 'FCM token is required', 'string.min': 'FCM token must be at least 10 characters' })
	})
};

const removeStudentFCMTokens = {
	query: Joi.object().keys({ studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) })
};

export default {
	addStudentFCMTokens,
	updateStudentFCMTokens,
	removeStudentFCMTokens
};


