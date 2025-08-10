const mongoose = require("mongoose");
const recipes = require("./models/schema.js");

// MongoDB Connection
main()
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
};

//insert samlple data 
// recipes.insertMany([
//   {
//     "title": "Spaghetti Aglio e Olio",
//     "description": "A classic Italian pasta dish made with garlic, olive oil, and chili flakes.",
//     "ingredients": [
//       "Spaghetti",
//       "Olive oil",
//       "Garlic",
//       "Chili flakes",
//       "Parsley",
//       "Salt"
//     ],
//     "instructions": [
//       "Boil spaghetti until al dente.",
//       "Sauté garlic in olive oil until golden.",
//       "Add chili flakes and cooked pasta.",
//       "Toss well and garnish with parsley."
//     ],
//     "category": "Veg",
//     "imageUrl": "https://example.com/images/spaghetti.jpg",
//     "tags": ["Italian", "Pasta", "Quick"],
//     "createdAt": "2025-08-10T10:00:00.000Z"
//   },
//   {
//     "title": "Chicken Curry",
//     "description": "Spicy and flavorful Indian chicken curry.",
//     "ingredients": [
//       "Chicken",
//       "Onions",
//       "Tomatoes",
//       "Garlic",
//       "Ginger",
//       "Spices",
//       "Yogurt"
//     ],
//     "instructions": [
//       "Marinate chicken in yogurt and spices.",
//       "Sauté onions, garlic, and ginger.",
//       "Add tomatoes and cook till soft.",
//       "Add chicken and cook until done."
//     ],
//     "category": "Non-Veg",
//     "imageUrl": "https://example.com/images/chickencurry.jpg",
//     "tags": ["Indian", "Spicy", "Dinner"],
//     "createdAt": "2025-08-09T15:30:00.000Z"
//   },
//   {
//     "title": "Chocolate Brownies",
//     "description": "Rich and fudgy chocolate brownies.",
//     "ingredients": [
//       "Dark chocolate",
//       "Butter",
//       "Sugar",
//       "Eggs",
//       "Flour",
//       "Cocoa powder"
//     ],
//     "instructions": [
//       "Melt chocolate and butter.",
//       "Whisk in sugar and eggs.",
//       "Fold in flour and cocoa powder.",
//       "Bake at 180°C for 25 minutes."
//     ],
//     "category": "Dessert",
//     "imageUrl": "https://example.com/images/brownies.jpg",
//     "tags": ["Baking", "Chocolate", "Sweet"],
//     "createdAt": "2025-08-08T12:00:00.000Z"
//   },
//   {
//     "title": "Fruit Salad",
//     "description": "Refreshing salad with seasonal fruits.",
//     "ingredients": [
//       "Apple",
//       "Banana",
//       "Grapes",
//       "Orange",
//       "Honey",
//       "Lemon juice"
//     ],
//     "instructions": [
//       "Chop all fruits into bite-sized pieces.",
//       "Mix with honey and lemon juice.",
//       "Serve chilled."
//     ],
//     "category": "Other",
//     "imageUrl": "https://example.com/images/fruitsalad.jpg",
//     "tags": ["Healthy", "Quick", "Vegan"],
//     "createdAt": "2025-08-07T09:15:00.000Z"
//   }
// ]);


// collection view
recipes.find()
.then((res)=>{
  console.log(res);
}).catch((err)=>{
  console.log(err);
});