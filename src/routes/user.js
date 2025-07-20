const express = require("express")
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const {ConnectionRequest} = require("../models/connectionRequest");
const { User } = require("../models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills" ; // we can also use this string in the populate method


// get all the pending connection requests for the loggedInUser
userRouter.get("/user/requests/received",userAuth, async (req,res) => {

    try {
        const loggedInUser = req.user;

        const connRequest = await ConnectionRequest.find({
            toUserId : loggedInUser._id,
            status : "interested" 
        }).populate("fromUserId", "firstName lastName photoUrl age gender about skills"); // 2nd method
       // }).populate("fromUserId", ["firstName", "lastName"]); // 1st method

        res.status(200).json({
            message : "Data fetched successfully!",
            data : connRequest
        })

    } catch (error) {

        res.status(400).send("Error : "+ error.message);
        
    }

})


// get all the connections 
userRouter.get("/user/connections",userAuth, async(req,res) => {
     
    try {

        const loggedInUser = req.user;

        // Deepesh => Mark
        // Mark => Deepesh
        // we have to check for both of these

        const connRequests = await ConnectionRequest.find({
            $or : [
               { fromUserId : loggedInUser._id , status : "accepted" },
               { toUserId : loggedInUser._id , status : "accepted"},
            ],
        })
        .populate("fromUserId", USER_SAFE_DATA)
        .populate("toUserId", USER_SAFE_DATA);

        const dataOfFromUserId = connRequests.map( (row) => {
            if(row.fromUserId._id.toString() === loggedInUser._id.toString()){

              return row.toUserId;

            }

            return row.fromUserId;
        });

        res.status(200).json({
            message : "Connections fetches sucessfully!",
            data : dataOfFromUserId
        });
        
    } catch (error) {

        res.send(400).send({ message : error.message });
        
    }
});


// feed API
userRouter.get("/user/feed", userAuth, async (req,res) => {

    try {
        // User dont not show these cards 
        // 0. his own card
        // 1. his connections [means accepted requests]
        // 2. ignored people
        // 3. already sent the connection request to

        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;

        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;

        // checks for the page
        if(page < 0){
            return res
                   .status(400)
                   .json({
                    message : "Invalid request",
                    success : false
                   });
        }

        const skip = (page - 1) * limit;

        // find all the connection requests (sent + received )
        const connRequests = await ConnectionRequest.find({
            $or: [
                {fromUserId : loggedInUser._id},
                {toUserId : loggedInUser._id}
            ]
        }).select("fromUserId toUserId");

        // }).select("fromUserId toUserId").populate("fromUserId", "firstName").populate("toUserId", "firstName"); 

      // hide these users from the feed  
        const hideUsersFromFeed = new Set();

        connRequests.forEach((req) => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });
       
        // find all the users whose id is not present in the hideUsersFromFeed
        const usersFeed = await User.find({
           $and: [ 
            {_id : { $nin : Array.from(hideUsersFromFeed)}},
            {_id : {$ne : loggedInUser._id}},

           ],
        }).select(USER_SAFE_DATA).skip(skip).limit(limit);

        res.status(200).json({
            message : "User Feed fetches successfully!",
            data : usersFeed
        });
        
        
        
    } catch (error) {

        res.status(400).json({
            message : error.message
        });
        
    }

})



module.exports = {
    userRouter,
}