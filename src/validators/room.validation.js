import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const addRoom = {
	body: Joi.object().keys({
		roomNumber: Joi.string().trim().min(1).max(50).required().messages({ 'any.required': 'Room number is required', 'string.min': 'Room number must be at least 1 character', 'string.max': 'Room number cannot exceed 50 characters' }),
		sittingCapacity: Joi.number().integer().min(1).max(1000).required().messages({ 'any.required': 'Sitting capacity is required', 'number.base': 'Sitting capacity must be a number', 'number.min': 'Sitting capacity must be at least 1', 'number.max': 'Sitting capacity cannot exceed 1000' })
	})
};

const getRooms = {
	query: Joi.object().keys({
		searchQuery: Joi.string().allow('', null).default('').messages({ 'string.base': 'Search query must be a string' }),
		sortBy: Joi.string().valid('roomNumber', 'sittingCapacity').default('roomNumber').messages({ 'any.only': 'SortBy must be either roomNumber or sittingCapacity' }),
		sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC').messages({ 'any.only': 'SortOrder must be either ASC or DESC' }),
		busyBetweenStartTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({ 'string.pattern.base': 'busyBetweenStartTime must be in HH:mm:ss format', 'any.required': 'Start time is required' }),
		busyBetweenEndTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({ 'string.pattern.base': 'busyBetweenEndTime must be in HH:mm:ss format', 'any.required': 'End time is required' }),
		page: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' })
	}).and('busyBetweenStartTime', 'busyBetweenEndTime')
};

const getRoomById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) })
};

const updateRoom = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		roomNumber: Joi.string().trim().min(1).max(50).messages({ 'string.min': 'Room number must be at least 1 character', 'string.max': 'Room number cannot exceed 50 characters' }),
		sittingCapacity: Joi.number().integer().min(1).max(1000).messages({ 'number.base': 'Sitting capacity must be a number', 'number.min': 'Sitting capacity must be at least 1', 'number.max': 'Sitting capacity cannot exceed 1000' })
	}).min(1).messages({ 'object.min': 'Provide at least one field to update' })
};

const removeRoom = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) })
};

export default {
	addRoom,
	getRooms,
	getRoomById,
	updateRoom,
	removeRoom
};


