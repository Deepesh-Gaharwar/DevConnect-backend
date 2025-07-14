const express = require("express");
const connectionRequestRouter = express.Router();

const { userAuth } = require("../middlewares/auth.js")


// sendConnectionRequest -> route

connectionRequestRouter.post("/sendConnectionRequest",userAuth, async (req,res) => {

    // we can read the user who is sending the request beacause userAuth middleware attach the user with the request obj

    const user = req.user;

    // sending a connection request

    res.status(200).send(user.firstName +" sent the connection request!") 
});


module.exports = {
    connectionRequestRouter,
}