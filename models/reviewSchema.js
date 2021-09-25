const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./UserSchema');


const reviewSchema = new Schema({
  rating:{
    type:Number,
    required:true
  },
  body:{
    type:String,
    required:true
  },
  user:{
    type:Schema.Types.ObjectId,
    ref:'User'
  }
})

const Review = mongoose.model('Review',reviewSchema);
module.exports = Review;
