const express = require("express")
const profileRouter = express.Router();

const validator = require("validator");

const { userAuth } = require("../middlewares/auth.js");
const { validateEditProfileData } = require("../utils/validation.js");


// profile/view -> route
profileRouter.get("/profile/view", userAuth, async (req,res) => {

    try{

        const user = req.user; // coming from the userAuth middleware req obj

        res.status(200).send(user);

    } catch(error){
         
        res.status(400).send("Error :" + error.message);
    }
})


// profile/edit -> route
profileRouter.patch("/profile/edit", userAuth, async (req,res) => {

    try {

        if(!validateEditProfileData(req)){

            throw new Error("Invalid Edit Request!");
        }

        const {firstName,lastName,emailId,photoUrl,age,about,skills} = req.body;
        

        if(firstName && firstName.length > 50 || lastName && lastName.length > 20 ){
            throw new Error("Invalid Edit Request: firstName and lastName should not exceed 50 characters.");
        }

        // is emailId valid 
         if (emailId && !validator.isEmail(emailId)) {

            throw new Error("Email is not valid!");
         }

        // is photoUrl valid
         if(photoUrl && !validator.isURL(photoUrl)){
            throw new Error("PhotoUrl is not valid!");
         } 

        // is age valid
        if (age && (!Number.isInteger(Number(age)) || age < 18 || age > 65)) {
           throw new Error("Age must be a valid number between 18 and 65.");
        } 
        
        // is about valid
        if(about && about.length > 50){
           throw new Error("About should not be more than 50 characters");
        } 
        
        // is skills valid
        if(skills && (!Array.isArray(skills) || skills.length > 10)){
          throw new Error("Skills must be an array with max 10 items.");
        }

        const loggedInUser = req.user;

        // edit these -> this is not the good way to do this
        // loggedInUser.firstName = firstName;
        // loggedInUser.lastName = lastName;
        // loggedInUser.emailId = emailId;
        // loggedInUser.photoUrl = photoUrl;
        // loggedInUser.age = age;
        // loggedInUser.about = about;
        // loggedInUser.skills = skills;

        // edit these fields

        Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

        // save to the DB
        await loggedInUser.save();

        res.status(200).json({ 
            message :`${loggedInUser.firstName}, your profile updated successfully!`,
            data : loggedInUser
        });
        
    } catch (error) {
        res.status(400).send("Error : " + error.message);
    }

})


module.exports = {
    profileRouter,
}