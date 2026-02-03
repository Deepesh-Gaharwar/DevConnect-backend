const mongoose = require("mongoose");

// message Schema
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    deliveredAt: {
      type: Date,
    },
    seenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);


// Chat Schema

const chatSchema = new mongoose.Schema(
    {    
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId, 
                ref: "User",
                required: true,
            }
        ],
        messages: [messageSchema],
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = {
    Chat,
}