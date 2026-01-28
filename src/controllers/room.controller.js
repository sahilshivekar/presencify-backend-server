import { Op, col, where as sqWhere, cast } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Room from '../db/models/room.model.js';
import Class from '../db/models/class.model.js';
import httpStatus from 'http-status';

const addRoom = asyncHandler(async (req, res) => {
    const { roomNumber, sittingCapacity, name = null, type = null } = req.body;

    const room = await Room.create({
        roomNumber,
        sittingCapacity,
        name: name === '' ? null : name,
        type
    });

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Room added successfully", room));
});

const getRooms = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        sortBy = 'roomNumber',
        sortOrder = 'ASC',
        busyBetweenStartTime,
        busyBetweenEndTime,
        page = 1,
        limit = 10,
        getAll = false,
        type
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (searchQuery) {
        where[Op.or] = [
            { roomNumber: { [Op.iLike]: `%${searchQuery}%` } },
            { name: { [Op.iLike]: `%${searchQuery}%` } },
            // Cast enum column to text for ILIKE search
            sqWhere(cast(col('room_type'), 'TEXT'), { [Op.iLike]: `%${searchQuery}%` })
        ];
    }
    if (type) {
        where.type = type;
    }

    const include = [];
    if (busyBetweenStartTime && busyBetweenEndTime) {
        include.push({
            model: Class,
            required: false,
            duplicating: false,
            where: {
                [Op.and]: [
                    { activeTill: { [Op.gte]: new Date() } },
                    { startTime: { [Op.lte]: busyBetweenEndTime } },
                    { endTime: { [Op.gte]: busyBetweenStartTime } }
                ]
            }
        });
    }

    const rooms = await Room.findAndCountAll({
        where,
        ...(include.length ? { include } : {}),
        order: [[sortBy, sortOrder]],
        ...(limit && getAll === false ? { limit } : {}),
        ...(limit && getAll === false ? { offset } : {})
    });

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Rooms retrieved successfully.", {
        rooms: rooms.rows,
        totalCount: rooms.count
    }));
});

const getRoomById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Room fetched successfully",
                room
            )
        );
});

const updateRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { roomNumber, sittingCapacity, name, type } = req.body;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    room.roomNumber = roomNumber || room.roomNumber;
    room.sittingCapacity = sittingCapacity || room.sittingCapacity;
    if (name !== undefined) room.name = name === '' ? null : name;
    if (type !== undefined) room.type = type;

    await room.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Room updated successfully", room));
});

const removeRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    await room.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Room deleted successfully", null));
});

const getRoomShedule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, startTime, endTime } = req.query;

    const room = await Room.findByPk(id);
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');

    const classes = await Class.findAll({
        where: {
            roomId: id,
            [Op.and]: [
                { activeFrom: { [Op.lte]: endDate } },
                { activeTill: { [Op.gte]: startDate } },
                { startTime: { [Op.lte]: endTime } },
                { endTime: { [Op.gte]: startTime } }
            ]
        },
        order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });

    res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, 'Room schedule fetched successfully', { room, classes }));
});

export {
    addRoom,
    getRooms,
    getRoomById,
    getRoomShedule,
    updateRoom,
    removeRoom
}