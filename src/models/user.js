const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true,
        minLength : 3,
        maxLength : 50,
    },
    lastName : {
        type : String,
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

const User = mongoose.model("User",userSchema);

module.exports = {
    User
};