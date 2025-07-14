const express = require("express");
const {connectDB} = require("./DB/db.js");

const app = express();

const cookieParser = require("cookie-parser");

app.use(express.json()); // to read the json data coming from the request to body

app.use(cookieParser()); // to read the cokkies 


// routes 
const { authRouter } = require("./routes/auth.js");
const { profileRouter } = require("./routes/profile.js");
const { connectionRequestRouter } = require("./routes/connectionRequests.js");


app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",connectionRequestRouter);




// Database connection

connectDB().then( () => {
    console.log("Databse connection established successfully !!!");

    app.listen(3000, () => {
    console.log("Server is successfully listening on port 3000...")

    });

}).catch(err => {
    console.log("Databse cannot be connected !!!",err.message);
})