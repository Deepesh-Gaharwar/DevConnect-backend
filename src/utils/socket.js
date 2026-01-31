// socket configuration
const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const { ConnectionRequest } = require("../models/connectionRequest");

const getSecretRoomId = ({userId, targetUserId}) => {
   return crypto
   .createHash("sha256")
   .update([userId, targetUserId].sort().join("_"))
   .digest("hex");
}

const initializeSocket = (server) => {
    const io = socket(server, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
     // Handle events

        // join chat  
        socket.on("joinChat", ({userId, targetUserId}) => {
           // whenever there is a joinChat, we need to create a room, which has  a roomId.In that room there are multiple participants & they can chat with each other

           // we also have to seperate rooms for individual people

           const roomId = getSecretRoomId({ userId, targetUserId });

           socket.join(roomId);
        });

        // send message
          socket.on("sendMessage", async ({
            firstName,
            lastName, 
            userId, 
            targetUserId, 
            text

            }) => {
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
                if(!friends) {
                  return res.status(400).json("You are not a Connection of this User! Make sure both of you are friends first...");
                }

                // already existed chat in DB
                let chat = await Chat.findOne({
                  participants: {
                    $all: [userId, targetUserId],
                  },
                });

                // if not exists, create a new chat
                if (!chat) {
                  chat = new Chat({
                    participants: [userId, targetUserId],
                    messages: [],
                  });
                }

                // push the messages into the Chat DB
                chat.messages.push({
                  senderId: userId,
                  text,
                });

                await chat.save(); // saved to DB

                // server is transferring the message to the same roomId
                io.to(roomId).emit("messageReceived", {
                  firstName,
                  lastName,
                  text,
                });


              } catch (error) {

                console.log(error.message);
              }             

            }); 
        
        // disconnect
        socket.on("disconnect", () => {});  

    });
};

module.exports = initializeSocket; 
