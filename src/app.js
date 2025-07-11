const express = require("express");

const app = express();

// this will only handle GET call to /user
app.get("/user", (req,res) => {
    res.send({ firstName: "Deepesh", lastName: "Gaharwar"})
})

// post call
app.post("/user", (req,res) => {
    // saving data to the DB
    res.send("Data successfully saved to the Databse");
})

// delete call
app.delete("/user", (req,res) => {
    res.send("Deleted successfully !!!")
})

app.use("/test",(req,res) => {
    res.send("Hello from the server !!!");
})



app.listen(3000, () => {
    console.log("Server is successfully listening on port 3000...")
});