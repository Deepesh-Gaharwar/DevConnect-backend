const express = require("express");
const {connectDB} = require("./DB/db.js");
const app = express();
// requiring models
const {User} = require("./models/user.js");
const {validateSignUpData} = require("./utils/validation.js");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth.js")



app.use(express.json()); // to read the json data coming from the request to body

app.use(cookieParser()); // to read the cokkies 


// /signup -> route

app.post("/signup",async (req,res) => {
  
    try{ 

     // validation of the data
       validateSignUpData(req);


     //encrypt the password

     const {firstName, lastName, emailId, password} = req.body;

      const passwordHash = await bcrypt.hash(password,10);
      

 
     // creating a new instance of the user Model 
       const user = new User ({
         firstName,
         lastName,
         emailId,
         password : passwordHash,
       });

        await user.save();

        res.status(200).send("User added successfully");

        console.log("User added successfully");
        
    }catch(err){
       res.status(400).send("Error :"+ err.message) ; 
    }
   
    

});


// login route handler 
app.post("/login", async (req,res) => {

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

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(isPasswordValid){
            
            // create a JWT token

            const token = await jwt.sign({ _id : user._id} , "DEV@Tinder$790");


            // add the token to cookie and send the response back to the user

            res.cookie("token",token);

            res.status(200).send("Login successfull!");
        }else{
            throw new Error("Invalid credentials!");
        }
        
    } catch (error) {
        res.status(400).send("Error :" +error.message);
        
    }
})

// profile route handler
app.get("/profile", userAuth, async (req,res) => {

    try{

        const cookies = req.cookies; // will get from the browser console of the logged in user

        const {token} = cookies; 

        if(!token){
            throw new Error("Invalid Token!")
        }

        // validate my token
        const decodedMessage = await jwt.verify(token, "DEV@Tinder$790"); // will get the decoded  _id of the user from the token

        const { _id } = decodedMessage; // we will get info about the logged in user

        const user = await User.findById(_id);

        if(!user){
            throw new Error("User does not exists");
        }

        res.status(200).send(user);

    } catch(error){
         
        res.status(400).send("Error :" + error.message);
    }
})


// get user by email
app.get("/user", async (req,res) => {
    const userEmail = req.body.emailId;

    try {
      const users =  await User.find({emailId : userEmail});

      if(users.length === 0){
         res.status(404).send("User not found");
       }else{
         res.send(users);
       }
             
    } catch (error) {
        res.status(400).send("Cannot get the userEmail")
    }
})

// /feed -> route
app.get("/feed", async (req,res) => {

    try {

        const users = await User.find({});

        res.send(users);
        
    } catch (error) {
        res.status(400).send("cannot get the users for your feed")
    }

})


// /user -> route = delete a user from the db
app.delete("/user",async (req,res) => {
    
    const userId = req.body.userId;

    try {

        const user = await User.findByIdAndDelete({_id : userId});

        res.send("User deleted successfully")
        
    } catch (error) {
        res.status(400).send("cannot get the user,so we cannot delete it")
    }
})


// /user -> update the user in the db
app.patch("/user/:userId", async (req,res) => {
    
    const userId = req.params?.userId;
    const data = req.body;


    try {
     
     // user is allowed to change the certain fields only
     const allowedUpdates = [
        "photoUrl",
        "about",
        "gender",
        "age",
        "skills"
     ]

        const isAllowedUpdates = Object.keys(data).every((k) => allowedUpdates.includes(k));

        if(!isAllowedUpdates){
            throw new Error("Update not allowed");
        }

        if(data?.skills.length > 10){
            throw new Error("Skills cannot be more than  10");
        }
      
      // find and update the user
        await User.findByIdAndUpdate({_id : userId}, data, {
            runValidators : true,
        });

        res.send("User updated successfully")
    } catch (error) {
        res.status(400).send("Update Failed !!!" + error.message);
    }
})



// Database connection

connectDB().then( () => {
    console.log("Databse connection established successfully !!!");

    app.listen(3000, () => {
    console.log("Server is successfully listening on port 3000...")

    });

}).catch(err => {
    console.log("Databse cannot be connected !!!",err.message);
})