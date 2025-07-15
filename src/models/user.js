const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true,
        minLength : 3,
        maxLength : 50,
    },
    lastName : {
        type : String,
        minLength : 0,
        maxLength : 50,
    },
    emailId : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        validate(value){
            if(!validator.isEmail(value)){
               throw new Error("Invalid email address :" + value);
            }
        }
    },
    password : {
        type : String,
        required : true,
        validate(value){
            if(!validator.isStrongPassword(value)){
               throw new Error("Enter a strong password  :" + value);
            }
        }

    },
    age : {
        type : Number,
        min : 18,
        max : 65,

    },
    gender : {
        type : String,
        validate(value) {
            if(!["male","female","others"].includes(value)){
                throw new Error("Gender data is not valid");
            }
        }
    },
    photoUrl : {
        type : String,
        default : "https://sipl.ind.in/leadership-team/",
        validate(value){
            if(!validator.isURL(value)){
                throw new Error("Invalid photo URL !!!");
            }
        }
    },
    about : {
        type : String,
        default : "This is the default about of the user",
        minLength : 0,
        maxLength : 50,
    },
    skills : {
        type : [String],
        maxLength : 10,
    }
}
,
{
    timestamps : true,
});


// handler method to  offloads the jwt token in the User Schema 

userSchema.methods.getJWT = async function () {

   const user = this; // not works in arrow functions

  const token = await  jwt.sign(
    { _id : user._id} , 
    "DEV@Tinder$790",
     { expiresIn : "1d",}
    );

    return token;
}


// password method offloads to the schema

userSchema.methods.validatePassword = async function (passwordInputByUser){
    const user = this;
    const passwordHash = user.password;

    const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);

    return isPasswordValid;
}


const User = new mongoose.model("User",userSchema);

module.exports = {
    User
};