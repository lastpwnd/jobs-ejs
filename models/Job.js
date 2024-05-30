const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema({
    company:{
        type:String,
        required:[true, "Please provide company name"],
        maxlength:30
    },
    position:{
        type:String,
        required:[true, "Please provide your position"],
        maxlength:30
    },
    status:{
        type:String,
        enum:["interview", "pending", "declined"],
        default: "pending"
    },
    createdBy:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required: [, "User creds are required"]
    }
},{timestamps:true})

module.exports = mongoose.model("Job", JobSchema)