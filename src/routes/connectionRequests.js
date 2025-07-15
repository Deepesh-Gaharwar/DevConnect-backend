const express = require("express");
const connectionRequestRouter = express.Router();

const { userAuth } = require("../middlewares/auth.js")

const { ConnectionRequest } = require("../models/connectionRequest.js");
const { User } = require("../models/user.js");


// sendConnectionRequest -> route

connectionRequestRouter.post("/request/send/:status/:toUserId",userAuth, async (req,res) => {

    try {

        // we can read the user who is sending the request beacause userAuth middleware attach the user with the request obj

        const fromUserId = req.user._id; // loggedIn User

        const toUserId = req.params.toUserId;

        const status = req.params.status;

        // allowed status
        const allowedStatus = ["ignored", "interested"];

        if(!allowedStatus.includes(status)){
            return res.status(400).json({
             message : "Invalid status type : "+status
            })
        }


        // whether the toUserId is exists in DB or not

        const toUser = await User.findById(toUserId) ;

        if(!toUser){
            return res.status(404).json({
                message : "User not found",
            })
        };

        // if there is an existing request 
        const existingConnectionRequest = await ConnectionRequest.findOne({
           $or :[
            {
                fromUserId,
                toUserId,
            },
            {
                fromUserId : toUserId,
                toUserId : fromUserId,
            }
           ],
            
        });

        if(existingConnectionRequest){
            return res
                   .status(400)
                   .send({message : "Connection Request Already exists!"})
        }

        
        // sending a connection request

        const request = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        });

       const data = await request.save();

        res.status(200).json({
            message : "Connection request sent successfully!" ,
            data : data,
        }) 
        
    } catch (error) {
        res.status(400).send("Error : " + error.message);
    }
});


module.exports = {
    connectionRequestRouter,
}