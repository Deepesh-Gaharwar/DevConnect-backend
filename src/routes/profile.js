const express = require("express")
const profileRouter = express.Router();

const validator = require("validator");
const bcrypt = require("bcrypt");

const { userAuth } = require("../middlewares/auth.js");
const { validateEditProfileData } = require("../utils/validation.js");
const { User } = require("../models/user");
const { sendMail } = require("../utils/sendMail");


// profile/view -> route
profileRouter.get("/profile/view", userAuth, async (req,res) => {

    try{

        const user = req.user; // coming from the userAuth middleware req obj

        res.status(200).send(user);

    } catch(error){
         
        res.status(401).send("Error :" + error.message);
    }
})


// profile/edit -> route
profileRouter.patch("/profile/edit", userAuth, async (req,res) => {

    try {

        if(!validateEditProfileData(req)){

            throw new Error("Invalid Edit Request!");
        }

        const {firstName,lastName,emailId,photoUrl,age,about,skills, gender} = req.body;
        

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

        // validate gender
        if (gender && !["male", "female", "other"].includes(gender.toLowerCase())) {
            throw new Error("Gender must be one of: male, female, or other.");
        }
        
        // is about valid
        if(about && about.length > 300){
           throw new Error("About should not be more than 300 characters");
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


// POST /profile/forgot-password/send-otp
profileRouter.post(
  "/profile/forgot-password/send-otp",
  async (req, res) => {
    try {
      const { emailId } = req.body;

      if (!validator.isEmail(emailId)) {
        throw new Error("Invalid email");
      }

      const user = await User.findOne({ emailId });

      // Prevent email enumeration
      if (!user) {
        return res.status(200).send("If the email exists, OTP has been sent.");
      }

      // check for validity, that it has attemps left for today or not 
      if (user.resetOtpBlockedUntil && user.resetOtpBlockedUntil > Date.now()) {

        return res.status(429).json({
          message: "OTP attempts exceeded. Try again after 24 hours.",
          retryAfter: user.resetOtpBlockedUntil,
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.resetOtpHash = await bcrypt.hash(otp, 10);
      user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      user.resetOtpAttempts = 0;

      await user.save();

      // sendMail
      await sendMail({
        to: emailId,
        subject: "🔐 Reset Your DevConnect Password",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6">
            <h2>DevConnect Password Reset</h2>
            <p>Use the OTP below to reset your password:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>
            <p><b>Valid for 10 minutes</b></p>
            <p>If you didn’t request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      res.status(200).send("OTP sent to your email");
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);



// POST /profile/forgot-password/verify-otp
profileRouter.post("/profile/forgot-password/verify-otp", async (req, res) => {
  try {
    const { emailId, otp } = req.body;

    const user = await User.findOne({ emailId });

    if (!user || !user.resetOtpHash) {
      throw new Error("Invalid request");
    }

    // Check if blocked
    if (user.resetOtpBlockedUntil && user.resetOtpBlockedUntil > Date.now()) {
      const retryAfter = user.resetOtpBlockedUntil;
      return res.status(429).json({
        message: "Too many attempts",
        retryAfter,
      });
    }

    // Expired OTP

    if (user.resetOtpExpires < Date.now()) {
      throw new Error("OTP expired");
    }

    const isValid = await bcrypt.compare(otp, user.resetOtpHash);

    if (!isValid) {
      user.resetOtpAttempts += 1;

      // Lock after 5 attempts
      if (user.resetOtpAttempts >= 5) {
        user.resetOtpBlockedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      }

      await user.save();

      throw new Error("Invalid OTP");
    }

    // OTP correct - reset attempts
    user.resetOtpAttempts = 0;
    user.resetOtpBlockedUntil = undefined;
    await user.save();

    res.status(200).send("OTP verified");

  } catch (err) {
    res.status(400).send(err.message);
  }
});

// PATCH /profile/forgot-password/reset

profileRouter.patch("/profile/forgot-password/reset", async (req, res) => {
  try {
    const { emailId, newPassword } = req.body;

    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("Weak password");
    }

    const user = await User.findOne({ emailId });
    if (!user || !user.resetOtpHash) {
      throw new Error("Unauthorized");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = undefined;

    await user.save();

    res.status(200).send("Password reset successful");
  } catch (err) {
    res.status(400).send(err.message);
  }
});




module.exports = {
    profileRouter,
}