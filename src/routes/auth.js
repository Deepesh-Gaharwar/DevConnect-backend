const express = require("express");
const authRouter = express.Router();

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

           // create a JWT token

            const token = await user.getJWT(); // coming from the userSchema that has offloaded method of getJWt()


            // add the token to cookie and send the response back to the user

            res.cookie("token",token, { expires : new Date(Date.now() + 8 * 3600000) });

        res.status(200).json({
            message : "User added successfully",
            data : savedUser
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

            res.cookie("token",token, { expires : new Date(Date.now() + 8 * 3600000) });

            res.status(200).json({
                message : "Logged In Successfully!",
                data : user
            });
        }else{
            throw new Error("Invalid credentials!");
        }
        
    } catch (error) {
        res.status(400).send("Error : " +error.message);
        
    }
})


// logout -> route
authRouter.post("/logout", async (req,res) => {

    res.cookie("token", null, { expires : new Date(Date.now()),

    });
   
    res.status(200).send("Logout successful!");

})




module.exports = {
    authRouter,
}