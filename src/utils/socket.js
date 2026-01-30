// socket configuration
const socket = require("socket.io");
const crypto = require("crypto");

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
        socket.on("joinChat", (userId, targetUserId) => {
           // whenever there is a joinChat, we need to create a room, which has  a roomId.In that room there are multiple participants & they can chat with each other

           // we also have to seperate rooms for individual people

           const roomId = getSecretRoomId(userId, targetUserId);

           socket.join(roomId);
        });

        // send message
        socket.on("sendMessage", ({
            firstName, 
            userId, 
            targetUserId, 
            text

            }) => {
                const roomId = getSecretRoomId(userId, targetUserId);

              // server is transferring the message to the same roomId    
                io.to(roomId).emit("messageReceived", {
                    firstName,
                    text,
                }); 
            }); 
        
        // disconnect
        socket.on("disconnect", () => {});  

    });
};

module.exports = initializeSocket; 
