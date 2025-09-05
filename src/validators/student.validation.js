import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const getStudents = {
	query: Joi.object().keys({
		searchQuery: Joi.string().allow('', null).default('').messages({ 'string.base': 'Search query must be a string' }),
		branchIds: Joi.alternatives().try(Joi.array().items(uuid.messages({ 'string.guid': 'Each branch ID must be a valid UUID' })), uuid).allow(null).messages({ 'alternatives.types': 'branchIds must be a UUID or array of UUIDs' }),
		semesterNumbers: Joi.alternatives().try(Joi.array().items(Joi.number().integer().min(1).max(20)), Joi.number().integer().min(1).max(20)).allow(null).messages({ 'alternatives.types': 'semesterNumbers must be a number or array of numbers' }),
		academicStartYearOfSemester: Joi.number().integer().min(1900).max(3000).allow(null).messages({ 'number.base': 'Academic start year must be a number' }),
		academicEndYearOfSemester: Joi.number().integer().min(1900).max(3000).allow(null).messages({ 'number.base': 'Academic end year must be a number' }),
		semesterId: uuid.allow(null).messages({ 'string.guid': 'Semester ID must be a valid UUID' }),
		batchId: uuid.allow(null).messages({ 'string.guid': 'Batch ID must be a valid UUID' }),
		schemeId: uuid.allow(null).messages({ 'string.guid': 'Scheme ID must be a valid UUID' }),
		divisionId: uuid.allow(null).messages({ 'string.guid': 'Division ID must be a valid UUID' }),
		dropoutAcademicStartYear: Joi.number().integer().min(1900).max(3000).allow(null).messages({ 'number.base': 'Dropout academic start year must be a number' }),
		dropoutAcademicEndYear: Joi.number().integer().min(1900).max(3000).allow(null).messages({ 'number.base': 'Dropout academic end year must be a number' }),
		admissionTypes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).allow(null).messages({ 'alternatives.types': 'admissionTypes must be a string or array of strings' }),
		admissionYear: Joi.number().integer().min(1900).max(3000).allow(null).messages({ 'number.base': 'Admission year must be a number' }),
		currentBatch: Joi.boolean().default(false).messages({ 'boolean.base': 'currentBatch must be a boolean' }),
		currentDivision: Joi.boolean().default(false).messages({ 'boolean.base': 'currentDivision must be a boolean' }),
		currentSemester: Joi.boolean().default(false).messages({ 'boolean.base': 'currentSemester must be a boolean' }),
		divisionCode: Joi.string().allow('', null).messages({ 'string.base': 'Division code must be a string' }),
		batchCode: Joi.string().allow('', null).messages({ 'string.base': 'Batch code must be a string' }),
		page: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' })
	})
};

const addStudent = {
	body: Joi.object().keys({
		prn: Joi.string().trim().max(100).required().messages({ 'any.required': 'PRN is required', 'string.max': 'PRN cannot exceed 100 characters' }),
		firstName: Joi.string().trim().min(1).max(100).required().messages({ 'any.required': 'First name is required', 'string.min': 'First name must be at least 1 character', 'string.max': 'First name cannot exceed 100 characters' }),
		middleName: Joi.string().allow('', null).messages({ 'string.base': 'Middle name must be a string' }),
		lastName: Joi.string().trim().min(1).max(100).required().messages({ 'any.required': 'Last name is required', 'string.min': 'Last name must be at least 1 character', 'string.max': 'Last name cannot exceed 100 characters' }),
		email: Joi.string().email().required().messages({ 'any.required': 'Email is required', 'string.email': 'Please provide a valid email address' }),
		phoneNumber: Joi.string().trim().required().messages({ 'any.required': 'Phone number is required' }),
		gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({ 'any.required': 'Gender is required', 'any.only': "Gender must be one of 'Male', 'Female', or 'Other'" }),
		dob: Joi.string().allow('', null).messages({ 'string.base': 'DOB must be a string' }),
		schemeId: uuid.required().messages({ 'any.required': 'Scheme ID is required', 'string.guid': 'Scheme ID must be a valid UUID' }),
		admissionYear: Joi.number().integer().min(1900).max(3000).required().messages({ 'any.required': 'Admission year is required', 'number.base': 'Admission year must be a number' }),
		admissionType: Joi.string().trim().required().messages({ 'any.required': 'Admission type is required' }),
		branchId: uuid.required().messages({ 'any.required': 'Branch ID is required', 'string.guid': 'Branch ID must be a valid UUID' }),
		parentEmail: Joi.string().email().allow('', null).messages({ 'string.email': 'Parent email must be a valid email' })
	})
};

const updateStudentDetails = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		firstName: Joi.string().trim().min(1).max(100).messages({ 'string.min': 'First name must be at least 1 character', 'string.max': 'First name cannot exceed 100 characters' }),
		middleName: Joi.string().allow('', null).messages({ 'string.base': 'Middle name must be a string' }),
		lastName: Joi.string().trim().min(1).max(100).messages({ 'string.min': 'Last name must be at least 1 character', 'string.max': 'Last name cannot exceed 100 characters' }),
		email: Joi.string().email().messages({ 'string.email': 'Please provide a valid email address' }),
		gender: Joi.string().valid('Male', 'Female', 'Other').messages({ 'any.only': "Gender must be one of 'Male', 'Female', or 'Other'" }),
		phoneNumber: Joi.string().trim().messages({ 'string.base': 'Phone number must be a string' }),
		dob: Joi.string().messages({ 'string.base': 'DOB must be a string' }),
		schemeId: uuid.messages({ 'string.guid': 'Scheme ID must be a valid UUID' }),
		branchId: uuid.messages({ 'string.guid': 'Branch ID must be a valid UUID' }),
		parentEmail: Joi.string().email().messages({ 'string.email': 'Parent email must be a valid email' }),
		prn: Joi.string().trim().messages({ 'string.base': 'PRN must be a string' }),
		admissionYear: Joi.number().integer().min(1900).max(3000).messages({ 'number.base': 'Admission year must be a number' }),
		admissionType: Joi.string().trim().messages({ 'string.base': 'Admission type must be a string' })
	}).min(1).messages({ 'object.min': 'Provide at least one field to update' })
};

const updateStudentPassword = {
	body: Joi.object().keys({
		id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }),
		password: Joi.string().min(8).max(128).required().messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 8 characters', 'string.max': 'Password cannot exceed 128 characters' }),
		confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Password and confirm password must match', 'any.required': 'Confirm password is required' })
	})
};

const updateStudentImage = {
	body: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) })
};

const removeStudentImage = {
	query: Joi.object().keys({ studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) })
};

const removeStudent = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) })
};

const getStudentDetailsById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) })
};

const getStudentSemestersById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) })
};

const getStudentDivisionsById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) }),
	query: Joi.object().keys({ semesterNumber: Joi.number().integer().min(1).max(20).allow(null).messages({ 'number.base': 'Semester number must be a number' }) })
};

const getStudentBatchesById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }) }),
	query: Joi.object().keys({ semesterNumber: Joi.number().integer().min(1).max(20).allow(null).messages({ 'number.base': 'Semester number must be a number' }) })
};

const addStudentToSemester = {
	body: Joi.object().keys({
		studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }),
		semesterId: uuid.required().messages({ 'any.required': 'Semester ID is required', 'string.guid': 'Semester ID must be a valid UUID' })
	})
};

const removeStudentFromSemester = {
	query: Joi.object().keys({ studentSemesterId: uuid.required().messages({ 'any.required': 'studentSemesterId is required', 'string.guid': 'studentSemesterId must be a valid UUID' }) })
};

const addStudentToDivision = {
	body: Joi.object().keys({
		studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }),
		divisionId: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' })
	})
};

const changeStudentDivision = {
	body: Joi.object().keys({
		studentDivisionId: uuid.required().messages({ 'any.required': 'studentDivisionId is required', 'string.guid': 'studentDivisionId must be a valid UUID' }),
		divisionId: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' }),
		newDivisionStartDate: Joi.date().iso().required().messages({ 'any.required': 'New division start date is required' })
	})
};

const addStudentToBatch = {
	body: Joi.object().keys({
		studentId: uuid.required().messages({ 'any.required': 'Student ID is required', 'string.guid': 'Student ID must be a valid UUID' }),
		batchId: uuid.required().messages({ 'any.required': 'Batch ID is required', 'string.guid': 'Batch ID must be a valid UUID' })
	})
};

const changeStudentBatch = {
	body: Joi.object().keys({
		studentBatchId: uuid.required().messages({ 'any.required': 'studentBatchId is required', 'string.guid': 'studentBatchId must be a valid UUID' }),
		batchId: uuid.required().messages({ 'any.required': 'Batch ID is required', 'string.guid': 'Batch ID must be a valid UUID' }),
		newBatchStartDate: Joi.date().iso().required().messages({ 'any.required': 'New batch start date is required' })
	})
};

export default {
	getStudents,
	addStudent,
	updateStudentDetails,
	updateStudentPassword,
	updateStudentImage,
	removeStudentImage,
	removeStudent,
	getStudentDetailsById,
	getStudentSemestersById,
	getStudentDivisionsById,
	getStudentBatchesById,
	addStudentToSemester,
	removeStudentFromSemester,
	addStudentToDivision,
	changeStudentDivision,
	addStudentToBatch,
	changeStudentBatch
};


