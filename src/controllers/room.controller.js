import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Room from '../db/models/room.model.js';

const addRoom = asyncHandler(async (req, res) => {
    const { roomNumber, sittingCapacity } = req.body;

    const room = await Room.create({
        roomNumber,
        sittingCapacity
    });

    res.status(201).json(new ApiResponse(201, "Room added successfully", room));
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

    res.status(200).json(new ApiResponse(200, "Rooms retrieved successfully.", {
        rooms: rooms.rows,
        totalCount: rooms.count
    }));
});

const getRoomById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(404, "Room not found");

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Room fetched successfully",
                room
            )
        );
});

const updateRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { roomNumber, sittingCapacity } = req.body;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(404, "Room not found");

    room.roomNumber = roomNumber || room.roomNumber;
    room.sittingCapacity = sittingCapacity || room.sittingCapacity;

    await room.save();

    res.status(200).json(new ApiResponse(200, "Room updated successfully", room));
});

const removeRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) throw new ApiError(404, "Room not found");

    await room.destroy();

    res.status(200).json(new ApiResponse(200, "Room deleted successfully", null));
});

export {
    addRoom,
    getRooms,
    getRoomById,
    updateRoom,
    removeRoom
}