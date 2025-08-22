app.get("/recipe/:id", async (req, res) => {
  const recipeId = req.params.id;
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`;

  try {
    const response = await axios.get(url);
    const meal = response.data.meals ? response.data.meals[0] : null;

    if (!meal) {
      return res.redirect("/?error=" + encodeURIComponent("Recipe not found"));
    }

    // Convert API data to match your schema
    const recipe = {
      _id: recipeId,
      title: meal.strMeal,
      category: meal.strCategory,
      tags: meal.strTags ? meal.strTags.split(",") : [],
      imageUrl: meal.strMealThumb,
      ingredients: Object.keys(meal)
        .filter(k => k.startsWith("strIngredient") && meal[k])
        .map((k, i) => `${meal[k]} - ${meal[`strMeasure${i+1}`]}`),
      instructions: meal.strInstructions.split(/\r?\n/).filter(s => s.trim())
    };

    // TODO: Fetch ratings & comments from Review.js
    const avgRating = 0;
    const totalRatings = 0;
    const userRating = null;
    const comments = [];

    res.render("recipe-details", { 
      recipe, 
      userId: req.session?.userId || null, 
      avgRating, 
      totalRatings, 
      userRating, 
      comments 
    });

  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.redirect("/?error=" + encodeURIComponent("Could not load recipe details"));
  }
});
