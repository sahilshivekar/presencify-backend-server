import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Room from '../db/models/room.model.js';


const addRoom = asyncHandler(async (req, res) => {
    const {
        roomNumber,
        sittingCapacity
    } = req.body;

    const room = await Room.create({
        roomNumber: roomNumber || null,
        sittingCapacity: sittingCapacity || null
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
        getAll = "false",
    } = req.query;


    if (!['roomNumber', 'sittingCapacity'].includes(sortBy)) {
        throw new ApiError(400, "Sort by must be either roomNumber or sittingCapacity");
    }


    if (!['ASC', 'DESC'].includes(sortOrder)) {
        throw new ApiError(400, "Sort order must be either ASC or DESC");
    }

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
        ...(limit && getAll == "false" ? { limit } : {}),
        ...(limit && getAll == "false" ? { offset } : {})
    });

    res.status(200).json(new ApiResponse(200, "Rooms retrieved successfully.", {
        rooms: rooms.rows,
        totalCount: rooms.count
    }));
});

const getRoomById = asyncHandler(async (req, res) => {
    const { roomId } = req.query;

    if (!roomId) {
        throw new ApiError(400, "Room id is required");
    }

    const room = await Room.findByPk(roomId);

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
    const { roomId, roomNumber, sittingCapacity } = req.body;

    if (!roomId) {
        throw new ApiError(400, "Room id is required");
    }

    const room = await Room.findByPk(roomId);

    if (!room) throw new ApiError(404, "Room not found");

    room.roomNumber = roomNumber || room.roomNumber;
    room.sittingCapacity = sittingCapacity || room.sittingCapacity;

    await room.save();

    res.status(200).json(new ApiResponse(200, "Room updated successfully", room));
});

const removeRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.query;

    if (!roomId) {
        throw new ApiError(400, "Room id is required");
    }

    const room = await Room.findByPk(roomId);

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