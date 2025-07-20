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


// request review -> route
connectionRequestRouter.post("/request/review/:status/:requestId", userAuth , async (req,res) => {

   try {

     const loggedInUser = req.user;

     const { status, requestId } = req.params;

    // validate the status 

     const allowedStatus = ["accepted", "rejected"];

     if(!allowedStatus.includes(status)){
        
        return res.status(400).json({
            message : "Status is not allowed!"
        })
     }

    // Deepesh => Elon
    // is Elon loggedInUser(loggedInId) == toUserId
    // status = interested
    // requestId should be valid  

    // we will check if the requestId is present in the DB or not
    
    const connRequest = await ConnectionRequest.findOne({
        _id : requestId,
        toUserId : loggedInUser._id,
        status : "interested"
    })

    if(!connRequest){
        return res.status(404).json({
            message : "Connection request not found!"
        })
    }

    connRequest.status = status;

    const data = await connRequest.save();

    res.status(200).json({
        message : "Connection request "+status ,
        data : data 
    });

   } catch (error) {
      
    res.status(400).send("Error : "+error.message);
   }


})


module.exports = {
    connectionRequestRouter,
}