const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const { before } = req.query; // cursor
  const userId = req.user._id;

  const limit = 20;

  try {
    // find the chat between these users
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    })
      .populate("messages.senderId", "firstName lastName")
      .lean();

    // for first time user
    if (!chat) {
      chat = await Chat.create({
        participants: [userId, targetUserId],
        messages: [],
      });
    }

    let messages = chat.messages;

    // pagination
    if (before) {
      messages = messages.filter(
        (m) => new Date(m.createdAt) < new Date(before),
      );
    }

    messages = messages.slice(-limit);

    // await chat.save(); // saved th chat in DB

    res.status(200).json({
      messages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = {
    chatRouter,
};