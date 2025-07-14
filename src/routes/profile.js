const express = require("express")
const profileRouter = express.Router();

const { userAuth } = require("../middlewares/auth.js")


// profile -> route
profileRouter.get("/profile", userAuth, async (req,res) => {

    try{

        const user = req.user; // coming from the userAuth middleware req obj

        res.status(200).send(user);

    } catch(error){
         
        res.status(400).send("Error :" + error.message);
    }
})


module.exports = {
    profileRouter,
}