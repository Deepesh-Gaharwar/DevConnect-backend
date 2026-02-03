// socket configuration
const socketIO = require("socket.io");
const crypto = require("crypto");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const { Chat } = require("../models/chat");
const { ConnectionRequest } = require("../models/connectionRequest");
const { User} = require("../models/user");

const getSecretRoomId = ({userId, targetUserId}) => {
   return crypto
   .createHash("sha256")
   .update([userId, targetUserId].sort().join("_"))
   .digest("hex");
}

// online users
const onlineUsers = new Set();

const initializeSocket = (server) => {
    const io = socketIO(server, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      },
      transports: ["websocket"],
    });

    io.on("connection", (socket) => {

      // socket authentication
      try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        const token = cookies.token;

        if (!token) {
          socket.disconnect();
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // user id of logged in user
        socket.userId = decoded._id;
      } catch (error) {
        socket.disconnect();
        return;
      }

      const userId = socket.userId;

      // adding online presence
      onlineUsers.add(userId);

      // send full online list to THIS user
      socket.emit("onlineUsers", Array.from(onlineUsers));

      // notify others
      socket.broadcast.emit("userOnline", { userId });

      // Handle events

      // join chat
      socket.on("joinChat", async ({ targetUserId }) => {
        // whenever there is a joinChat, we need to create a room, which has  a roomId.In that room there are multiple participants & they can chat with each other

        // we also have to seperate rooms for individual people

        const roomId = getSecretRoomId({ userId, targetUserId });

        socket.join(roomId);

        // mark messages as seen
        await Chat.updateOne(
          {
            participants: { $all: [userId, targetUserId] },
            "messages.senderId": targetUserId,
            "messages.seenAt": { $exists: false },
          },
          { $set: { "messages.$[msg].seenAt": new Date() } },
          {
            arrayFilters: [
              {
                "msg.senderId": targetUserId,
                "msg.seenAt": { $exists: false },
              },
            ],
          },
        );

        io.to(roomId).emit("messagesSeen", {
          seenBy: userId,
        });
      });

      // send message
      socket.on("sendMessage", async ({ targetUserId, text }) => {
        const userId = socket.userId;
        const roomId = getSecretRoomId({ userId, targetUserId });

        // save messages to the DB
        try {
          // check if userId & targetUserId are friends
          const friends = await ConnectionRequest.findOne({
            $or: [
              {
                fromUserId: userId,
                toUserId: targetUserId,
                status: "accepted",
              },
              {
                fromUserId: targetUserId,
                toUserId: userId,
                status: "accepted",
              },
            ],
          });

          // not a connection
          if (!friends) {
            socket.emit("errorMessage", "You are not connected with this user");
            return;
          }

          // already existed chat in DB
          let chat = await Chat.findOne({
            participants: {
              $all: [userId, targetUserId],
            },
          });

        // if not created, create / for first time users  
          if (!chat) {
            chat = await Chat.create({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          // push the messages into the Chat DB
          chat.messages.push({
            senderId: userId,
            text,
            deliveredAt: new Date(),
          });


          await chat.save(); // saved to DB

          // server is transferring the message to the same roomId
          io.to(roomId).emit("messageReceived", {
            senderId: userId,
            text,
          });
        } catch (error) {
          console.log(error.message);
        }
      });

      // disconnect
      socket.on("disconnect", async () => {
        onlineUsers.delete(userId);

        await User.findByIdAndUpdate(userId, {
        lastSeenAt: new Date(),
      });

      socket.broadcast.emit("userOffline", {
        userId,
        lastSeenAt: new Date(),
      });
      });
    });
};

module.exports = initializeSocket; 
