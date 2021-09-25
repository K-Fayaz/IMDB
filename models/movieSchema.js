const mongoose = require('mongoose')
const Review = require('./reviewSchema')

const movieSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true,
    index:true,
    text:true
  },
  year:{
    type:Number,
    required:true
  },
  rating:{
    type:Number,
    required:true
  },
  image:{
    type:String,
    required:true
  },
  language:{
    type: String ,
    required:true
  },
  category:{
    type:String,
    enum:['Fantasy','Comedy','Sci-fi','Romantic','Tragedy','Drama','Action']
  },
  rate:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Review'
    }
  ]
})

movieSchema.index({name:'text'})

const Movie = mongoose.model('Movie',movieSchema);
module.exports = Movie
