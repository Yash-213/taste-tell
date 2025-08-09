// DOM Elements
const track = document.getElementById("recipeTrack");
const leftArrow = document.querySelector(".nav-arrow.left");
const rightArrow = document.querySelector(".nav-arrow.right");
const showMoreArrow = document.getElementById("showMoreArrow");
const modeToggle = document.getElementById("mode-toggle");
const searchInput = document.getElementById("searchInput");

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  displayRecipes();
  checkSavedTheme();
});

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'card recipe-card';
    card.innerHTML = `
        <img src="${recipe.imageUrl || 'placeholder.jpg'}" 
             class="card-img-top" 
             alt="${recipe.title}" 
             loading="lazy">
        <div class="card-body">
            <h5 class="card-title">${recipe.title}</h5>
            <p class="card-text text-muted">${recipe.description || ''}</p>
            <div class="mb-2">
                ${recipe.tags ? recipe.tags.map(tag => 
                    `<span class="badge bg-secondary me-1">${tag}</span>`).join('') : ''}
                <span class="badge bg-primary">${recipe.prepTime + recipe.cookTime} mins</span>
            </div>
            <div class="rating mb-2">
                ${getStarRating(recipe.rating)}
                <small class="text-muted">(${(recipe.rating || 0).toFixed(1)})</small>
            </div>
            <button class="btn btn-sm btn-outline-primary w-100 view-recipe" 
                    data-id="${recipe._id}">
                View Recipe
            </button>
        </div>
    `;
    return card;
}

// Helper function for star ratings
function getStarRating(rating) {
    const numRating = Number(rating) || 0;
    const fullStars = Math.round(numRating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(Math.max(0, Math.min(fullStars, 5))) + 
           '☆'.repeat(Math.max(0, Math.min(emptyStars, 5)));
}

// ====================
// RECIPE FUNCTIONALITY
// ====================

// Fetch recipes from backend API
async function fetchRecipes() {
  try {
    const response = await fetch("/api/recipes");
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

// Display recipes in the carousel
async function displayRecipes() {
  const recipes = await fetchRecipes();
  const recipeTrack = document.getElementById("recipeTrack");

  // Clear existing cards (except show more arrow)
  recipeTrack.innerHTML = "";

  recipes.forEach((recipe) => {
    const card = createRecipeCard(recipe);
    recipeTrack.appendChild(card);
  });

  // Add show more arrow at the end
  recipeTrack.appendChild(showMoreArrow);
  checkScrollPosition();
}

// Create recipe card HTML element
function createRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "card recipe-card";
  card.innerHTML = `
        <img src="${
          recipe.imageUrl || "https://via.placeholder.com/280x180?text=No+Image"
        }" 
             class="card-img-top" 
             alt="${recipe.title}" 
             loading="lazy">
        <div class="card-body">
            <h5 class="card-title">${recipe.title}</h5>
            <p class="card-text text-muted">${recipe.description || ""}</p>
            <div class="mb-2">
                ${
                  recipe.tags
                    ? recipe.tags
                        .map(
                          (tag) =>
                            `<span class="badge bg-secondary me-1">${tag}</span>`
                        )
                        .join("")
                    : ""
                }
                <span class="badge bg-primary">${
                  recipe.prepTime + recipe.cookTime
                } mins</span>
            </div>
            <div class="rating mb-2">
    ${getStarRating(recipe.rating)}
    <small class="text-muted">(${(recipe.rating || 0).toFixed(1)})</small>
</div>
            <button class="btn btn-sm btn-outline-primary w-100 view-recipe" 
                    data-id="${recipe._id}">
                View Recipe
            </button>
        </div>
    `;
  return card;
}

// Fetch single recipe details
async function fetchRecipeDetails(id) {
  try {
    const response = await fetch(`/api/recipes/${id}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    return null;
  }
}

// Show recipe in modal
function showRecipeModal(recipe) {
  if (!recipe) return;

  const modalContent = `
        <div class="modal-header">
            <h3 class="modal-title">${recipe.title}</h3>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <img src="${
              recipe.imageUrl ||
              "https://via.placeholder.com/800x400?text=No+Image"
            }"
                class="img-fluid mb-3 rounded" 
                alt="${recipe.title}" 
                loading="lazy">
            <p class="lead">${recipe.description || ""}</p>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h5><i class="fas fa-carrot text-success me-2"></i> Ingredients</h5>
                    <ul class="list-group list-group-flush mb-3">
                        ${recipe.ingredients
                          .map(
                            (ing) => `<li class="list-group-item">${ing}</li>`
                          )
                          .join("")}
                    </ul>
                </div>
                <div class="col-md-6">
                    <h5><i class="fas fa-mortar-pestle text-primary me-2"></i> Instructions</h5>
                    <ol class="list-group list-group-numbered list-group-flush">
                        ${recipe.instructions
                          .map(
                            (inst, i) =>
                              `<li class="list-group-item">${inst}</li>`
                          )
                          .join("")}
                    </ol>
                </div>
            </div>
            
            <div class="mt-4">
                <span class="badge bg-success me-2"><i class="fas fa-clock"></i> Prep: ${
                  recipe.prepTime
                } mins</span>
                <span class="badge bg-primary me-2"><i class="fas fa-fire"></i> Cook: ${
                  recipe.cookTime
                } mins</span>
                <span class="badge bg-warning text-dark"><i class="fas fa-utensils"></i> Servings: ${
                  recipe.servings
                }</span>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary"><i class="fas fa-print me-2"></i>Print Recipe</button>
        </div>
    `;

  // Get or create modal element
  let modal = document.getElementById("recipeModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "recipeModal";
    modal.className = "modal fade";
    modal.tabIndex = "-1";
    modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    ${modalContent}
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector(".modal-content").innerHTML = modalContent;
  }

  // Show modal using Bootstrap
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

// ====================
// CAROUSEL FUNCTIONALITY
// ====================

// Check scroll position and toggle arrows
function checkScrollPosition() {
  const scrollLeft = track.scrollLeft;
  const maxScroll = track.scrollWidth - track.clientWidth;
  const atStart = scrollLeft <= 10;
  const atEnd = scrollLeft >= maxScroll - 10;

  // Toggle left arrow
  if (atStart) {
    leftArrow.classList.remove("visible");
  } else {
    leftArrow.classList.add("visible");
  }

  // Toggle right arrow and show more button
  if (atEnd) {
    rightArrow.classList.remove("visible");
    showMoreArrow.classList.remove("visible");
  } else {
    rightArrow.classList.add("visible");
    showMoreArrow.classList.add("visible");
  }
}

// Scroll recipes horizontally
function scrollRecipes(direction) {
  track.scrollBy({
    left: direction * 300,
    behavior: "smooth",
  });

  // Recheck scroll position after scrolling
  setTimeout(checkScrollPosition, 300);
}

// Load more recipes function
function loadMoreRecipes() {
  alert("Loading more delicious recipes...");
  // In a real implementation, you would fetch more recipes here
  // Example: fetchNextPageOfRecipes().then(recipes => addRecipesToCarousel(recipes));
}

// ====================
// DARK MODE FUNCTIONALITY
// ====================

// Toggle dark/light mode
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const icon = modeToggle.querySelector("i");
  const isDark = document.body.classList.contains("dark-mode");

  icon.classList.toggle("fa-moon");
  icon.classList.toggle("fa-sun");

  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
}

// Check for saved theme preference
function checkSavedTheme() {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    const icon = modeToggle.querySelector("i");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }
}

// ====================
// SEARCH FUNCTIONALITY
// ====================

// Filter recipes based on search input
async function filterRecipes() {
  const input = searchInput.value.toLowerCase();
  const recipes = await fetchRecipes();
  const recipeTrack = document.getElementById("recipeTrack");

  // Clear existing cards
  recipeTrack.innerHTML = "";

  if (input === "") {
    // If search is empty, show all recipes
    displayRecipes();
    return;
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const titleMatch = recipe.title.toLowerCase().includes(input);
    const descMatch =
      recipe.description?.toLowerCase().includes(input) || false;
    const tagMatch =
      recipe.tags?.some((tag) => tag.toLowerCase().includes(input)) || false;
    const ingMatch =
      recipe.ingredients?.some((ing) => ing.toLowerCase().includes(input)) ||
      false;

    return titleMatch || descMatch || tagMatch || ingMatch;
  });

  if (filteredRecipes.length === 0) {
    // Show "no results" message
    recipeTrack.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x mb-3 text-muted"></i>
                <h4>No recipes found for "${input}"</h4>
                <p class="text-muted">Try a different search term</p>
            </div>
        `;
  } else {
    // Display filtered recipes
    filteredRecipes.forEach((recipe) => {
      const card = createRecipeCard(recipe);
      recipeTrack.appendChild(card);
    });
  }

  checkScrollPosition();
}

// ====================
// EVENT LISTENERS
// ====================

// Recipe carousel events
track.addEventListener("scroll", checkScrollPosition);
window.addEventListener("resize", checkScrollPosition);
leftArrow.addEventListener("click", () => scrollRecipes(-1));
rightArrow.addEventListener("click", () => scrollRecipes(1));
showMoreArrow.addEventListener("click", loadMoreRecipes);

// Dark mode toggle
modeToggle.addEventListener("click", toggleTheme);

// Search functionality
searchInput.addEventListener("input", filterRecipes);

// Handle recipe clicks (using event delegation)
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("view-recipe")) {
    const recipeId = e.target.getAttribute("data-id");
    const recipe = await fetchRecipeDetails(recipeId);
    showRecipeModal(recipe);
  }
});
