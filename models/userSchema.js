const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')
const Review = require('./reviewSchema')


const UserSchema = new Schema({
  email:{
    type:String,
    required:true,
    unique:true
  }
})

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User',UserSchema);

module.exports = User
