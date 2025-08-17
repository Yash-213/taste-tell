const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require("express-session");
const MongoStore =require("connect-mongo");
const cors = require('cors');
const { title } = require('process');
const Recipe = require("./models/Recipe");
const Review = require('./models/Review');
const user = require("./models/User");

const app = express();

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/test";
mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

// Middleware
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); 

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("trust proxy", 1);
app.use(
  session({
    name: "taste.sid",
    secret: process.env.SESSION_SECRET || "tasteTellSecret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      stringify: false,
      ttl: 60 * 60 * 24, 
    }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, 
      sameSite: "lax",
    },
  })
);

// --- Locals (Navbar + flash-like messages) ---
app.use((req, res, next) => {
  res.locals.username = req.session?.username || null;
  res.locals.error = req.query.error || null;
  res.locals.success = req.query.success || null;
  next();
});

const authRoutes = require('./routes/auth');
app.use('/', authRoutes);


// MongoDB Connection
main()
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
}

// Main route
app.get('/', async (req, res) => {
  try {
    const dish = await Recipe.find().sort({ createdAt: -1 }).lean();
    res.render('index', { dish });
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching recipes');
  }
});

// Detail page with stats + recent comments
app.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findById(id).lean();
    if (!recipe) return res.status(404).send('Recipe not found');

    // ratings stats via aggregation
    const stats = await Review.aggregate([
      { $match: { recipeId: new mongoose.Types.ObjectId(id), rating: { $gte: 1 } } },
      { $group: { _id: '$recipeId', avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
    ]);

    const avgRating = stats.length ? Number(stats[0].avgRating.toFixed(1)) : 0;
    const totalRatings = stats.length ? stats[0].totalRatings : 0;

    const comments = await Review.find({
      recipeId: id,
      comment: { $exists: true, $ne: '' }
    }).sort({ date: -1 }).limit(20).lean();

    // 🔹 get user rating if logged in
    let userRating = null;
    if (req.session.userId) {
      const myReview = await Review.findOne({ recipeId: id, userId: req.session.userId });
      userRating = myReview ? myReview.rating : null;
    }

    res.render('recipe-details', { 
      recipe, 
      avgRating, 
      totalRatings, 
      comments, 
      userId: req.session.userId || null,   // ✅ Pass userId here
      userRating                             // ✅ Pass userRating here
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Error loading recipe');
  }
});

// AJAX: add rating (1–5)
app.post('/api/recipes/:id/rate', async (req, res) => {
  if (!req.session.userId) return res.status(403).json({ message: "Login required" });

  const { id } = req.params;
  const { rating } = req.body;

  const review = await Review.findOneAndUpdate(
    { recipeId: id, userId: req.session.userId },
    { rating },
    { upsert: true, new: true }
  );

  const stats = await Review.aggregate([
    { $match: { recipeId: new mongoose.Types.ObjectId(id), rating: { $gte: 1 } } },
    { $group: { _id: '$recipeId', avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
  ]);

  res.json({
    avgRating: stats[0]?.avgRating.toFixed(1) || 0,
    totalRatings: stats[0]?.totalRatings || 0,
    userRating: review.rating
  });
});



// AJAX: add comment
app.post('/api/recipes/:id/comment', async (req, res) => {
  if (!req.session.userId) return res.status(403).json({ message: "Login required" });

  const { id } = req.params;
  const { comment } = req.body;

  const created = await Review.create({
    recipeId: id,
    userId: req.session.userId,
    comment
  });

  res.json({ comment: { text: created.comment, date: created.date, _id: created._id } });
});

// Delete comment
app.delete('/api/recipes/:id/comment/:commentId', async (req, res) => {
  if (!req.session.userId) return res.status(403).json({ message: "Login required" });

  const { id, commentId } = req.params;

  const deleted = await Review.findOneAndDelete({
    _id: commentId,
    recipeId: id,
    userId: req.session.userId
  });

  if (!deleted) return res.status(403).json({ message: "Not allowed" });
  res.json({ success: true });
});


app.delete('/api/recipes/:id/comment/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;

    const review = await Review.findOneAndDelete({ _id: commentId, recipeId: id, userId });
    if (!review) return res.status(403).json({ message: "Not allowed" });

    res.json({ success: true, deletedId: commentId });
  } catch (e) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
});


// loginPage route
app.get("/login", async(req,res)=>{
  res.render("loginPage");
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>{ 
  console.log(`Server running on port ${PORT}`);
});
