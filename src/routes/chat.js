const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {

  const {targetUserId} = req.params;  

  const userId = req.user._id;

  try {
    // find the chat between these users
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
        path: "messages.senderId",
        select: "firstName lastName",
    });

    // for first time user
    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });

      await chat.save(); // saved th chat in DB
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = {
    chatRouter,
};