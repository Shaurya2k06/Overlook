const mongoose = require('mongoose');

async function connectMongoDB(url) {
    // console.log("url", url);
    return mongoose.connect(url);
}
// mongoose.connect("mongodb://127.0.0.1:27017/Node")
// .then(() => console.log("MongoDB Connected!!"))
// .catch(err => console.log("Error, Can't connect to DB", err));
//end

module.exports = {
    connectMongoDB,
}