const express = require("express");
const {connectDB} = require("./DB/db.js");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const http = require("http");

// cors and whitelisting of the frontend URl
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));

app.use(express.json()); // to read the json data coming from the request to body

app.use(cookieParser()); // to read the cokkies 


// routes 
const { authRouter } = require("./routes/auth.js");
const { profileRouter } = require("./routes/profile.js");
const { connectionRequestRouter } = require("./routes/connectionRequests.js");
const { userRouter } = require("./routes/user.js");
const paymentRouter = require("./routes/payment.js");
const initializeSocket = require("./utils/socket.js");
const { chatRouter } = require("./routes/chat.js");


app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",connectionRequestRouter);
app.use("/",userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);


// create a server for socket.io
const server = http.createServer(app);

// socket configuration
initializeSocket(server);

// Database connection

const PORT = process.env.PORT || 4000;

connectDB().then( () => {
    console.log("Databse connection established successfully !!!");

    server.listen(PORT, () => {
    console.log(`Server is successfully listening on port ${PORT} ...`)

    });

}).catch(err => {
    console.log("Databse cannot be connected !!!",err.message);
})