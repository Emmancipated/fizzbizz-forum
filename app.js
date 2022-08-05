// Required modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalmongoose = require("passport-local-mongoose");
// const res = require("express/lib/response");
// const req = require("express/lib/request");
// const { _serializers } = require("passport/lib");

// Using the express engine
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// Session initialization and configuration
app.use(session({
  secret: "our secret",
  resave: false,
  saveUninitialized: false
}));

// Passport initialization and to use session
app.use(passport.initialize());
app.use(passport.session());

// Connection to the DB

// mongoose.connect("mongodb://localhost:27017/fizzbizzDB", {useNewUrlParser:true});
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzbizzDB',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);
// mongoose.set("useCreateIndex", true); //prevents an err with deprecation

// Some Global Variables
let posts = [];
var catReqParam;
var counter = 1;
let currentCat;
let commentRoute = [];
let activePost = [];

// Schema for all the posts 
const articleSchema = new mongoose.Schema({
    postHead: String,
    postBody: String,
    url: Number,
    category: String,
    user: Object,
    likes: Array,
    dislikes: Array,
    // comments: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}]
    comments: { 
      comment: Object
    }
    }, {timestamps: true});

  
// User schema
const userSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  username: {type: String, unique: true, required: true, lowercase: true},
  moniker: {type: String, unique: true, required: true},
  password: String,
  phoneNumber: Number,
  dob: Date,
  likes: Number,
  gender: {type: String, possiblevalue: ["Male", "Female", "Other"]},
  avatar: {name: String, desc: String, alt: String, type: Buffer, contentType: String},
}, {timestamps: true});

//Comments schema
const commentSchema = new mongoose.Schema({
  commentBody: String,
  articleID:  {type: mongoose.Schema.Types.ObjectId, ref: "Article"},
  user: Object,
  likes: Array,
  dislikes: Array
}, {timestamps: true});


userSchema.plugin(passportLocalmongoose);

// The model for the posts
const Article = mongoose.model("Article", articleSchema);

// articleSchema.index({postBody: "text"});
Article.createIndexes({postBody: "text"});


// The model for the comments
const Comment = mongoose.model("Comment", commentSchema);

// The model for the users
const User = mongoose.model("User", userSchema);

// Passport local serializers
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// This is the route that registers the users
app.route("/register")
.get(function(req, res) {
res.render("register", {activeUser: req, err: ""});
})
// The post route for user registration
.post(function(req, res){
User.register(
  { fName: req.body.fName,
    lName: req.body.lName,
    username: req.body.username, 
    moniker: req.body.moniker, 
    phoneNumber: req.body.phoneNumber, 
    dob: req.body.dob,
    gender: req.body.gender
  
  }, req.body.password, function(err, user){
  if(err) {
    console.log(err);
    res.render("register", {activeUser: req, err: "A user with Username or email already exists"});
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });
  }
});
});

// The login route
app.route("/login")
.get(function(req, res){
  res.render("login", {activeUser: req});
})
.post(function (req, res){
const user = new User({
  username: req.body.username,
  password: req.body.password,
  moniker: req.body.moniker
});

// The block of codes that logs the user in or authenticates the user login
req.login(user, function(err){
  if(err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });
  }
})
// console.log(`Your email is ${newUser.email} and your password is ${newUser.password} ${newUser}`);
});

// The logout route
app.get("/logout", function(req, res){
  req.logout(function(err){
    if(err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

// Individual post is rendered from here
app.get(`/:topicNum/:topic`, function(req, res){
  // store the clients request to variable and convert it to lowercase
  const requestedTitleNumber = req.params.topicNum;
  const requestedTitle = _.toLower(req.params.topic);

  // Finds all articles from db and loops through it
  Article.find({}, function(err, article) {
    article.forEach(post => {
      // extracts the post name and title from clients query and matches with data in db before render
      const storeTitleNumber = post.url;
      const storedTitle = _.toLower(post.postHead);

      if(storedTitle === requestedTitle && requestedTitleNumber == storeTitleNumber) {
        const time = JSON.stringify(post.createdAt);
        // articleID is the link btw the post and comments
        Comment.find({articleID: post.id}, function(err, foundComments){
          if(err) {
            console.log(err);
          } else {
            res.render("categories", {
              postHead: post.postHead,
              postBody: post.postBody,
              author: post.user.moniker,
              activeUser: req,
              postID: post.id,
              url: post.url,
              comments: foundComments,
              postLike: post.likes.length,
              postdisLike: post.dislikes.length,
              createdAt: time,
              category: post.category
            });            
          }
        });      
      };      
    });
  });  
});

// Routes to the various pages

// Home Route
app.get("/", function(req, res) {
  Article.find({}, function(err, articles) {
      res.render("home", {topics: articles.reverse(), activeUser: req}); 
  })  
});

// Politics Route
app.get("/politics", function(req, res){
  Article.find({category: 'Politics'}, function(err, article) {
    res.render("politics", {articles: article.reverse(), activeUser: req}); 
  })
});

// Sports Route
app.get("/sports", function(req, res){
  Article.find({category: 'Sports'}, function(err, article) {
    res.render("sports", {articles: article.reverse(), activeUser: req}); 
  })
});

// Romance Route
app.get("/romance", function(req, res){
  Article.find({category: 'Romance'}, function(err, article) {
    res.render("romance", {articles: article.reverse(), activeUser: req}); 
  })
});

// Function that numbers posts/articles
function threadCounter(){
  Article.find({}, function(err, foundItems){
    counter = foundItems.length;
    counter++;
  })
};

// To render post writing page
app.route("/compose/post/:catHeader")
.get(function(req, res){
  threadCounter();
  catReqParam = req.params.catHeader;
  res.render("compose", {activeUser: req});
})
.post(function(req, res){ 
  if(req.isAuthenticated()) {
    const article = new Article({
      postHead: req.body.postTitle,
      postBody: req.body.postContent,
      url: counter,
      category: catReqParam,
      user: req.user
   });
   article.save();
   posts.unshift(article);
 
       currentCat = posts[0].category;
       if(currentCat = posts[0].category) {
         res.redirect(`/${posts[0].category}`);
       } else {
        console.log("Ok");
        res.redirect("/");
       } 
  } 

 
});

// To write a post
// app.route("/compose")
// .get(function(req, res){
//   threadCounter();
//   catReqParam = req.rawHeaders[25];
//   res.render("compose", {activeUser: req});
//   commentRoute.unshift(catReqParam); 
//   console.log(req);
// })
// .post(function(req, res){ 
//   if(req.isAuthenticated()) {
//     const article = new Article({
//       postHead: req.body.postTitle,
//       postBody: req.body.postContent,
//       url: counter,
//       cat: catReqParam,
//       user: req.user
//    });
//    article.save();
//    posts.unshift(article);
//    // Object.values(categoryTemplate).forEach(function(val){
//    //   if (val[0] === categories[0].cat) {
//    //     val.push(story);    
//    //     res.redirect(`${val[0].slice(22, 100)}`);
//    //   }
//        currentCat = posts[0].cat.slice(22);
//        if(currentCat = posts[0].cat.slice(22)) {
//          res.redirect(`${posts[0].cat.slice(22)}`);
//        } else {
//         console.log("Ok");
//         res.redirect("/");
//        } 
//   } 

 
// });

// for (const key in categoryTemplate) {
//   console.log(`${key}: ${categoryTemplate[key]}`);
// }

// app.get("/comment/:postid/:postNum", function(req, res){
//   res.render("comment", {activeUser: req, postID: req.params.postid, url: req.params.postNum});
//   console.log(req.rawHeaders[25]);
// })


// The route for commenting on the blog
app.get("/:numPost/:postName/:idpost/comment", function(req,res){
  console.log(req.params.idpost);
  res.render("comment", {activeUser: req, postID: req.params.idpost, url: req.params.numPost, postName: req.params.postName});
})

app.post("/:numPost/:postName/:idpost/comment", function(req, res){
  if(req.isAuthenticated()) {
  const comment = new Comment ({
    commentBody: req.body.postComment,
    articleID: req.params.idpost,
    user: req.user
  })
  Article.findByIdAndUpdate({_id:req.params.idpost},{$push: {comments: comment}}, function(err, foundArticle){
    console.log(foundArticle);
  })
  comment.save();
  res.redirect(`/${req.params.numPost}/${req.params.postName}`)
  // console.log(comment);
  //Article.updateOne({id: req.params.postid}, {comments: comment}
  // Article.insertMany([{comment: comment}], function(err, result){
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log(result);
  //   }
  // )
  // console.log(req.body);
  // Comment.create(req.body).then(function(newComment){
  //   console.log(newComment);
  // })
} else {
  res.send("You need to login");
}  

})

// The route that handles likes
app.post("/likes", function(req, res){
    
  let returnedData = Object.keys(req.body);
  let postID = returnedData[0];
  let commentID = returnedData[1];
  if(req.isAuthenticated()) {
  if(commentID == "post") {
    Article.findByIdAndUpdate({_id:postID},{$addToSet: {likes: req.user.id}}, function(err, foundArticle){
      res.redirect(`/${returnedData[2]}`)
      
    })
  } else {
    Comment.findByIdAndUpdate({_id:commentID},{$addToSet: {likes: req.user.id}}, function(err, foundComment){      
      res.redirect(`/${returnedData[2]}`)
    })
  }
  }
});

// The route that handles dislikes
app.post("/dislikes", function(req, res){
  let returnedData = Object.keys(req.body); //extracts just the keys of the returned object.
  let postID = returnedData[0];
  let commentID = returnedData[1];
  if(req.isAuthenticated()) {
  if(commentID == "post") {
    console.log("It is a post like");
    Article.findByIdAndUpdate({_id:postID},{$addToSet: {dislikes: req.user.id}}, function(err, foundArticle){
      res.redirect(`/${returnedData[2]}`)
    })
  } else {
    Comment.findByIdAndUpdate({_id:commentID},{$addToSet: {dislikes: req.user.id}}, function(err, foundComment){      
    res.redirect(`/${returnedData[2]}`)
    })
  }
  }
});

// The route for search bar
app.post("/search", async function(req, res){
  const searched = await Article.find({$text:{$search: req.body.searchbar}});
  if (!searched.length == 0) {
    res.render("search", {activeUser: req, searched: searched, norecord: ""});
  } else {
    res.render("search", {activeUser: req, searched: searched, norecord: "No records found."});  }
})

var port = process.env.PORT || 3000;

// The server listener
app.listen(port, function(){
  console.log("Server running on port 3000");
});


// if(req.isAuthenticated()) show the things that ought to be displayed when you have logged in.

