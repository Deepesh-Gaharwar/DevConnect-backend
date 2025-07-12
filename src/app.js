const express = require("express");

const {connectDB} = require("./DB/db.js");

// requiring models
const {User} = require("./models/user.js")

const app = express();


// routes 

app.post("/signup",async (req,res) => {
 
 // creating a new instance of the user Model 
    const user = new User ({
        firstName : "Deepesh",
        lastName : "Gaharwar",
        emailId : "test1@gmail.com",
        password : "test@123"
    })
  
    try{

        await user.save();

        res.status(200).send("User added successfully");

        console.log("User added successfully");
        
    }catch(err){
       res.status(400).send("Error saving the user :"+ err.message) ;
    }
   
    

});



// Database connection

connectDB().then( () => {
    console.log("Databse connection established successfully !!!");

    app.listen(3000, () => {
    console.log("Server is successfully listening on port 3000...")

    });

}).catch(err => {
    console.log("Databse cannot be connected !!!",err.message);
})