import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const addClass = {
	body: Joi.object().keys({
		teacherId: uuid.required().messages({ 'any.required': 'Teacher ID is required', 'string.guid': 'Teacher ID must be a valid UUID' }),
		startTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({ 'string.pattern.base': 'Start time must be in HH:mm:ss format', 'any.required': 'Start time is required' }),
		endTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({ 'string.pattern.base': 'End time must be in HH:mm:ss format', 'any.required': 'End time is required' }),
		dayOfWeek: Joi.string().trim().required().messages({ 'any.required': 'Day of week is required' }),
		roomId: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }),
		batchId: uuid.allow(null).messages({ 'string.guid': 'Batch ID must be a valid UUID' }),
		activeFrom: Joi.required().messages({ 'any.required': 'Active from date is required' }),
		activeTill: Joi.required().messages({ 'any.required': 'Active till date is required' }),
		classType: Joi.string().valid('Lecture', 'Tutorial', 'Practical').required().messages({ 'any.only': "Class type must be 'Lecture', 'Tutorial' or 'Practical'", 'any.required': 'Class type is required' }),
		courseId: uuid.required().messages({ 'any.required': 'Course ID is required', 'string.guid': 'Course ID must be a valid UUID' }),
		timetableId: uuid.required().messages({ 'any.required': 'Timetable ID is required', 'string.guid': 'Timetable ID must be a valid UUID' })
	})
};

const getClasses = {
	query: Joi.object().keys({
		searchQuery: Joi.string().allow('', null).default('').messages({ 'string.base': 'Search query must be a string' }),
		timetableId: uuid.allow(null).messages({ 'string.guid': 'Timetable ID must be a valid UUID' }),
		divisionId: uuid.allow(null).messages({ 'string.guid': 'Division ID must be a valid UUID' }),
		startTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).allow(null).messages({ 'string.pattern.base': 'Start time must be in HH:mm:ss format' }),
		endTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).allow(null).messages({ 'string.pattern.base': 'End time must be in HH:mm:ss format' }),
		activeFrom: Joi.allow(null).messages({ 'date.format': 'activeFrom must be a valid ISO date' }),
		activeTill: Joi.allow(null).messages({ 'date.format': 'activeTill must be a valid ISO date' }),
		teacherId: uuid.allow(null).messages({ 'string.guid': 'Teacher ID must be a valid UUID' }),
		dayOfWeek: Joi.string().trim().allow(null).messages({ 'string.base': 'Day of week must be a string' }),
		roomId: uuid.allow(null).messages({ 'string.guid': 'Room ID must be a valid UUID' }),
		batchId: uuid.allow(null).messages({ 'string.guid': 'Batch ID must be a valid UUID' }),
		classType: Joi.string().valid('Lecture', 'Tutorial', 'Practical').allow(null).messages({ 'any.only': "Class type must be 'Lecture', 'Tutorial' or 'Practical'" }),
		courseId: uuid.allow(null).messages({ 'string.guid': 'Course ID must be a valid UUID' }),
		semesterId: uuid.allow(null).messages({ 'string.guid': 'Semester ID must be a valid UUID' }),
		isExtraClass: Joi.boolean().default(false).messages({ 'boolean.base': 'isExtraClass must be a boolean' }),
		page: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' })
	})
};

const getClassById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Class ID is required', 'string.guid': 'Class ID must be a valid UUID' }) })
};

const extendActiveTillDateOfClass = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Class ID is required', 'string.guid': 'Class ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		newactiveTill: Joi.required().messages({ 'any.required': 'newActiveTill is required' })
	})
};

const removeClass = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Class ID is required', 'string.guid': 'Class ID must be a valid UUID' }) })
};

const addExtraClass = {
	body: Joi.object().keys({
		teacherId: uuid.required().messages({ 'any.required': 'Teacher ID is required', 'string.guid': 'Teacher ID must be a valid UUID' }),
		startTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({ 'string.pattern.base': 'Start time must be in HH:mm:ss format', 'any.required': 'Start time is required' }),
		endTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({ 'string.pattern.base': 'End time must be in HH:mm:ss format', 'any.required': 'End time is required' }),
		dayOfWeek: Joi.string().trim().required().messages({ 'any.required': 'Day of week is required' }),
		roomId: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }),
		batchId: uuid.allow(null).messages({ 'string.guid': 'Batch ID must be a valid UUID' }),
		activeFrom: Joi.required().messages({ 'any.required': 'Active from date is required' }),
		activeTill: Joi.required().messages({ 'any.required': 'Active till date is required' }),
		classType: Joi.string().valid('Lecture', 'Tutorial', 'Practical').required().messages({ 'any.only': "Class type must be 'Lecture', 'Tutorial' or 'Practical'", 'any.required': 'Class type is required' }),
		courseId: uuid.required().messages({ 'any.required': 'Course ID is required', 'string.guid': 'Course ID must be a valid UUID' }),
		timetableId: uuid.required().messages({ 'any.required': 'Timetable ID is required', 'string.guid': 'Timetable ID must be a valid UUID' })
	})
};

const getCancelledClasses = {
	query: Joi.object().keys({
		divisionId: uuid.allow(null).messages({ 'string.guid': 'Division ID must be a valid UUID' }),
		batchId: uuid.allow(null).messages({ 'string.guid': 'Batch ID must be a valid UUID' }),
		date: Joi.date().allow(null).messages({ 'date.format': 'Date must be a valid ISO date' }),
		page: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' })
	})
};

const cancelClass = {
	body: Joi.object().keys({
		classId: uuid.required().messages({ 'any.required': 'Class ID is required', 'string.guid': 'Class ID must be a valid UUID' }),
		date: Joi.date().required().messages({ 'any.required': 'Date is required' }),
		reason: Joi.string().allow('', null).messages({ 'string.base': 'Reason must be a string' })
	})
};

export default {
	addClass,
	getClasses,
	getClassById,
	extendActiveTillDateOfClass,
	removeClass,
	addExtraClass,
	getCancelledClasses,
	cancelClass
};


