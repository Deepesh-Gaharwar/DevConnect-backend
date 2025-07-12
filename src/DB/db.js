const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect(`${process.env.MONGODB_URl}/${DB_NAME}`);
}

module.exports = {
    connectDB
}