const express = require("express");
const authRouter = express.Router();
require("dotenv").config();

const {validateSignUpData} = require("../utils/validation.js");
const {User} = require("../models/user.js");
const bcrypt = require("bcrypt");
const validator = require("validator");


// signup -> route
authRouter.post("/signup",async (req,res) => {
  
    try{ 

     // validation of the data
       validateSignUpData(req);


     //encrypt the password

     const {firstName, lastName, emailId, password, age, gender} = req.body;

      const passwordHash = await bcrypt.hash(password,10);
      

 
     // creating a new instance of the user Model 
       const user = new User ({
         firstName,
         lastName,
         emailId,
         password : passwordHash,
         age,
         gender,
       });

        const savedUser = await user.save();

       // removing password from savedUser
        const userObj = savedUser.toObject();
        delete userObj.password;

        // create a JWT token

        const token = await user.getJWT(); // coming from the userSchema that has offloaded method of getJWt()


        // add the token to cookie and send the response back to the user

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 8 * 3600000),
        });

        res.status(200).json({
          message: "User added successfully",
          data: userObj,
        });
        
    }catch(err){
       res.status(400).send("Error :"+ err.message) ; 
    }
   
    

});


// login -> route 
authRouter.post("/login", async (req,res) => {

    try {

       const {emailId, password} = req.body;
     
       // is emailId valid 
        if(!validator.isEmail(emailId)){
       
            throw new Error("Email is not valid!");
       
        }

       // whether the user is in the DB , then check for the password compare i.e.,correct or not

       const user = await User.findOne({emailId : emailId});

       if(!user){
         throw new Error("Invalid credentials!")

        }

        const isPasswordValid = await user.validatePassword(password); // this is sent by the user 

        if(isPasswordValid){
          // create a JWT token

          const token = await user.getJWT(); // coming from the userSchema that has offloaded method of getJWt()

          // add the token to cookie and send the response back to the user

          res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          // removing password from user
          const userObj = user.toObject();
          delete userObj.password;

          res.status(200).json({
            message: "Logged In Successfully!",
            data: userObj,
          });

        }else{
            throw new Error("Invalid credentials!");
        }
        
    } catch (error) {
        res.status(400).send("Error : " +error.message);
        
    }
})


authRouter.post("/logout", async (req, res) => {
    try {
        
        res.cookie("token", "", {
            expires: new Date(0), // Immediately expire
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            path: "/"
        });

        res.status(200).json({ 
            success: true,
            message: "Logout successful" 
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ 
            success: false,
            message: "Logout failed" 
        });
    }
});




module.exports = {
    authRouter,
}