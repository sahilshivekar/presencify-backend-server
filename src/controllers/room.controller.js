import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Room from '../db/models/room.model.js';
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

    const rooms = await Room.findAndCountAll({
        where: searchClause,
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

export {
    addRoom,
    getRooms,
    getRoomById,
    updateRoom,
    removeRoom
}