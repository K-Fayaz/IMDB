const express = require('express');
const app = express();
const Movie = require('./models/movieSchema')
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override')
const  ExpressError  = require('./ErrorHandling/AppError');
const catchAsync = require('./ErrorHandling/AppError');
const joi = require('joi');
const flash =  require('connect-flash');
const User = require('./models/UserSchema');
const passport = require('passport');
const Local = require('passport-local');
const Review = require('./models/reviewSchema')

mongoose.connect('mongodb://localhost:27017/moviesApp',{useUnifiedTopology:true,useNewUrlParser:true})
.then(()=>{
  console.log('Server Connected');
})
.catch((e)=>{
  console.log(e);
})



const validateProductSchema = (req,res,next)=>{
  const schema = joi.object({
    name:joi.string().required(),
    year:joi.number().integer().min(1990).max(2021).required(),
    rating:joi.number().min(1).max(10).required(),
    image:joi.string().required(),
    language:joi.string().required(),
    category:joi.string().required()
  }).required()
  const { error } = schema.validate(req.body);
  if(error){
    const message = error.details.map(err=>err.message).join(',');
    throw new Error(message,404);
  }else{
    next();
  }
}

const userValidation = (req,res,next)=>{
  const userSchema = joi.object({
    username:joi.string().required(),
    email:joi.string().required(),
    password:joi.string().min(8).required()
  }).required()
  const { error } = userSchema.validate(req.body);
  if(error){
    const message  = error.details.map(data=>data.message).join(',');
    req.flash('error',message);
    res.redirect(`${req.originalUrl}`)
  }else{
    next()
  }
}

const reviewValidation = (req,res,next)=>{
  const reviewSchema = joi.object({
    rating:joi.number().min(1).max(10).required(),
    body:joi.string().required(),
    // user:joi.object().required()
  }).required()
  const { error } = reviewSchema.validate(req.body);
  if(error){
    const message  = error.details.map(data=>data.message).join(',');
    req.flash('error',message);
    res.redirect(`${req.originalUrl}`)
  }else{
    next()
  }
}

const sessionConfig = {
  secret:'ThisIsASecret',
  resave:false,
  saveUninitialized:true,
  cookie:{
    httpOnly:true
  }
}

const isLoggedIn = (req,res,next)=>{
  if(!req.isAuthenticated()){
    req.flash('error','You need to Login first !!');
    req.session.retrunTo = req.originalUrl;
    res.redirect('/login');
  }
  else{
    next()
  }
}
// <link rel="stylesheet" href="/styling/stars.css">
// app.use(async (req,res,next)=>{
//   const qwery = 'Ironwoman';
//   const movies = await Movie.find({$text:{$search:qwery}});
//   console.log(movies);
//   next()
// })

app.use(express.static(path.join(__dirname,'public')));
app.use(session(sessionConfig));
app.use(flash());
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended:true}));

app.use(passport.initialize())
app.use(passport.session())

passport.use(new Local(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));



app.use((req,res,next)=>{
  res.locals.good = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user;
  // console.log(currentUser)
  next();
})

// Home Routes

app.get('/home',async (req,res)=>{
  const fantasy =  await Movie.find({category:'Fantasy'});
  const comedy =  await Movie.find({category:'Comedy'});
  const scifi =  await Movie.find({category:'Sci-fi'});
  const romantic =  await Movie.find({category:'Romantic'});
  const tragedy =  await Movie.find({category:'Tragedy'});
  const drama =  await Movie.find({category:'Drama'});
  const action = await Movie.find({category:'Action'});
  res.render('movies/landingPage',{ fantasy , comedy , scifi, romantic , tragedy , drama , action })
})

//  Routes

app.get('/movies',catchAsync(async (req,res,next)=>{
  const movies = await  Movie.find({});
  res.render('movies/home', { movies });
}))

app.get('/movies/new',isLoggedIn,(req,res)=>{
  res.render('movies/new');
})

app.post('/movies',validateProductSchema,catchAsync(async (req,res,next)=>{
  const newMovie = await  new Movie(req.body);
  await newMovie.save();
  req.flash('success','Successfully added a movie to the database !!')
  res.redirect('/movies');
}))

app.get('/movies/:id' ,catchAsync(async (req,res,next)=>{
  try{
    const { id } = req.params;
    const foundMovie = await  Movie.findById(id).populate({path:'rate',
    populate:{
      path:'user'
    }
    });

    const category = foundMovie.category;
    const name  = foundMovie.name;
    const movies = await Movie.find({ $and:[ {category:category } , { name:{ $ne : name }}]});
     // console.log(foundMovie.rate.user.username)
    res.render('movies/show', { foundMovie , movies } )
  }
  catch(e){
    req.flash('error','Movie not found !!');
    res.redirect('/movies');
  }
}))

app.put('/movies/:id',validateProductSchema,isLoggedIn,catchAsync(async (req,res)=>{
  const { id } = req.params;
  const movie = await  Movie.findById(id);
  movie.name = req.body.name;
  movie.year = req.body.year;
  movie.rating = req.body.rating;
  movie.language = req.body.language;
  movie.image = req.body.image;
  movie.category = req.body.category;
  await movie.save();
  req.flash('success','Successfully edited a Movie !!');
  res.redirect(`/movies/${id}`);
}))


app.get('/movies/:id/edit',isLoggedIn, catchAsync(async (req,res)=>{
  const { id } = req.params;
  const movie =  await Movie.findById(id);
  res.render('movies/eidt', { movie })
}))

app.delete('/movies/:id',isLoggedIn,catchAsync(async (req,res)=>{
  const id = req.params.id;
  const movie = await Movie.findByIdAndDelete(id);
  req.flash('success',`${movie.name} is successfully deleted !`);
  res.redirect('/movies');
}))

// User Routes are here

app.get('/register', (req,res)=>{
  res.render('User/register')
})

app.post('/register',userValidation, async (req,res)=>{
  const { username , email , password } = req.body;
    const user = new User({ email , username });
    const registeredUser = await User.register(user,password);
    await registeredUser.save();
    req.flash('success',`Hi ${ registeredUser.username } welcome to IMDB `);
    res.redirect('/movies');
})

app.get('/login',(req,res)=>{
  res.render('User/login')
})

app.get('/logout',(req,res)=>{
  req.logout();
  req.flash('success','successfully logged You out !');
  res.redirect('/login');
})

app.post('/login',passport.authenticate('local', {failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
  req.flash('success','Welcome Back !');
  const redirectUrl = req.session.retrunTo || '/movies'
  res.redirect(`${redirectUrl}`)
})

app.post('/search',async (req,res)=>{
  const search = req.body.title;
  const movies = await Movie.find({$text:{$search:search}});
  if(movies.length){
    res.render('movies/search',{movies,search})
  }else{
    req.flash('error','Could not find the Movie');
    res.redirect('/movies');
  }
})

// Review Routes

app.get('/movies/:id/review',isLoggedIn,async  (req,res)=>{
  const id = req.params.id;
  const movie = await Movie.findById(id);
  const category = movie.category;
  const name = movie.name;
  const movies = await Movie.find({ $and:[ {category:category } , { name:{ $ne : name }}]});
  console.log(movies);
  res.render('Review/review',{movie , movies })
})


app.post('/movies/:id/review',isLoggedIn,async (req,res)=>{
  // res.send(req.body)
  const { rating , body } = req.body;
  const { id } = req.params;
  const movie = await Movie.findById(id);
  const review = new Review;
  review.rating = rating;
  review.body = body;
  review.user = req.user;
  movie.rate.push(review)
  await review.save();
  await movie.save();
  req.flash('success','Successfully made that review !');
  res.redirect(`/movies/${id}`);
})

app.delete('/movies/:id/review/:reviewId/delete', async (req,res)=>{
  const { id , reviewId } = req.params;
  const movie = await Movie.findByIdAndUpdate(id,{$pull:{rate:reviewId}});
  const review = await Review.findByIdAndDelete(reviewId);
  // res.send(movie)
  req.flash('success','Review is Deleted Successfully');
  res.redirect(`/movies/${id}`);
})

  // Middleware
app.use((err,req,res,next)=>{
  const { statusCode = 501 , message =" This page is not found !! "} = err;
  res.status(statusCode).render('error/errro',{ message });
})


app.listen(3000,(req,res)=>{
  console.log('Listening to the PORT 3000')
})
