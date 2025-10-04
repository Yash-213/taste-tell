const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require('cors');
const axios = require("axios");
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

app.use((req, res, next) => {
  res.locals.username = req.session?.username || null;
  res.locals.error = req.query.error || null;
  res.locals.success = req.query.success || null;
  next();
});

const authRoutes = require('./routes/auth');
app.use('/', authRoutes);


// --- TheMealDB helpers ---
const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

function mapMealToCard(meal, categoryOverride = null) {
  return {
    _id: meal.idMeal,                      
    title: meal.strMeal,
    imageUrl: meal.strMealThumb,
    category: categoryOverride || meal.strCategory || "Recipe",
    tags: meal.strTags ? meal.strTags.split(",") : []
  };
}

async function fetchMealsByCategory(category, limit = 12) {
  // TheMealDB: filter by category returns id, name, thumb
  const url = `${MEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`;
  const { data } = await axios.get(url);
  const meals = data.meals || [];
  return meals.slice(0, limit).map(m => mapMealToCard(m, category));
}

async function fetchMealsBySearch(term, limit = 24) {
  const url = `${MEALDB_BASE}/search.php?s=${encodeURIComponent(term)}`;
  const { data } = await axios.get(url);
  const meals = data.meals || [];
  // keep more fields if you want, but for cards we only need a few
  return meals.slice(0, limit).map(m => mapMealToCard(m, m.strCategory));
}


// Main route
app.get('/', async (req, res) => {
  try {
    const dish = await Recipe.find().sort({ createdAt: -1 }).lean();
        const [specials, vegMeals, nonVegMeals, dessertMeals] = await Promise.all([
      fetchMealsByCategory('Chicken', 12),
      fetchMealsByCategory('Vegetarian', 12),
      fetchMealsByCategory('Dessert', 12),
    ]);
    res.render('index', {
      dish,
      username: req.session?.username || null,
      searchMode: false,
      meals: [],
      query: "",
      specials,
      vegMeals,
      nonVegMeals,
      dessertMeals
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching recipes');
  }
});


// Search route
app.post('/search', async (req, res) => {
  const query = (req.body.searchTerm || "").trim();
  if (!query) {
    // no term → just go home
    return res.redirect('/');
  }

  try {
    const meals = await fetchMealsBySearch(query);

    // Render index in "search mode": only show search results section
    res.render('index', {
      username: req.session?.username || null,
      searchMode: true,
      meals,
      query,
      // empty sections so they don't render
      specials: [],
      vegMeals: [],
      nonVegMeals: [],
      dessertMeals: []
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.render('index', {
      username: req.session?.username || null,
      searchMode: true,
      meals: [],
      query,
      specials: [],
      vegMeals: [],
      nonVegMeals: [],
      dessertMeals: [],
      error: 'Could not fetch recipes.'
    });
  }
});


// Detail page with stats + recent comments
app.get("/recipe/:id", async (req, res) => {
  const mealId = req.params.id;
  const url = `${MEALDB_BASE}/lookup.php?i=${mealId}`;

  try {
    const { data } = await axios.get(url);
    const meal = data.meals ? data.meals[0] : null;

    if (!meal) {
      return res.status(404).render("recipe-details", { 
        recipe: null, 
        avgRating: 0, 
        totalRatings: 0,
        userRating: null,
        comments: [],
        userId: req.session?.userId || null
      });
    }

    const recipe = {
      _id: meal.idMeal,
      title: meal.strMeal,
      category: meal.strCategory || "Recipe",
      imageUrl: meal.strMealThumb,
      tags: meal.strTags ? meal.strTags.split(",") : [],
      ingredients: [],
      instructions: meal.strInstructions ? meal.strInstructions.split("\n").filter(Boolean) : []
    };

    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        recipe.ingredients.push(`${(measure || '').trim()} ${ing}`.trim());
      }
    }

    res.render("recipe-details", {
      recipe,
      avgRating: 0,
      totalRatings: 0,
      userRating: null,
      comments: [],
      userId: req.session?.userId || null
    });
  } catch (err) {
    console.error("Error fetching meal details:", err);
    res.status(500).send("Error loading recipe details.");
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
app.get("/login", async (req, res) => {
  res.render("loginPage");
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});