const Rooms = require("../model/Rooms");

async function createRoom(req, res) {
  try {
    const { rid } = req.body;
    if (!rid) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const existingRoom = await Rooms.findOne({ rid });
    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const newRoom = await Rooms.create({
      rid,
      owner: req.userId,
    });
    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: { roomId: newRoom.rid },
    });
  } catch (err) {
    console.log("error in create room");
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function addFilesToRoom(req, res) {
  try {
    const { rid, files } = req.body;
    if (!rid || !files || !Array.isArray(files)) {
      return res
        .status(400)
        .json({ message: "Room ID and files array are required" });
    }
    const room = await addFilesToRoomHelper(rid, files);
    if (room.rid) {
      return res
        .status(200)
        .json({ message: "Files added successfully", room });
    } else {
      return room;
    }
  } catch (err) {
    console.log("error in add files to room");
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function addFilesToRoomHelper(rid, files) {
  try {
    const room = await Rooms.findOne({ rid });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    room.files.push(...files);
    await room.save();
    return room;
  } catch (err) {
    console.error("Error adding files to room:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createRoom,
  addFilesToRoom,
};
