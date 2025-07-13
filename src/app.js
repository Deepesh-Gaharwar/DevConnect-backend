const express = require("express");


const {connectDB} = require("./DB/db.js");

// requiring models
const {User} = require("./models/user.js");

const app = express();

app.use(express.json()); // to read the json data coming from the requests to body


// /signup -> route

app.post("/signup",async (req,res) => {

 
 // creating a new instance of the user Model 
    const user = new User (req.body);
  
    try{

        await user.save();

        res.status(200).send("User added successfully");

        console.log("User added successfully");
        
    }catch(err){
       res.status(400).send("Error saving the user :"+ err.message) ;
    }
   
    

});


// get user by email
app.get("/user",async (req,res) => {
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
app.patch("/user", async (req,res) => {
    
    const userId = req.body.userId;
    const data = req.body;

    try {
        await User.findByIdAndUpdate({_id : userId}, data, {
            runValidators : true,
        });

        res.send("User updated successfully")
    } catch (error) {
        res.status(400).send("User is not updated .Please try again later !!!");
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