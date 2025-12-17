import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Room from '../db/models/room.model.js';
import Class from '../db/models/class.model.js';
import httpStatus from 'http-status';

const addRoom = asyncHandler(async (req, res) => {
    const { roomNumber, sittingCapacity } = req.body;

    const room = await Room.create({
        roomNumber,
        sittingCapacity
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
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            roomNumber: { [Op.iLike]: `%${searchQuery}%` }
        }
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
        where: searchClause,
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
    const { roomNumber, sittingCapacity } = req.body;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    room.roomNumber = roomNumber || room.roomNumber;
    room.sittingCapacity = sittingCapacity || room.sittingCapacity;

    await room.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Room updated successfully", room));
});

const removeRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    await room.destroy();

    res.status(httpStatus.NO_CONTENT).json(new ApiResponse(httpStatus.NO_CONTENT, "Room deleted successfully", null));
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