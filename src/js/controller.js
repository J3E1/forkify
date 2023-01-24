import * as model from './model';
import recipeView from './views/recipeView';
import searchView from './views/searchView';
import resultsView from './views/resultsView';
import bookmarksView from './views/bookmarksView';
import paginationView from './views/paginationView';
import addRecipeView from './views/addRecipeView';
// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

// if (module.hot) {
// 	module.hot.accept();
// }

const controlRecipes = async function () {
	try {
		const id = window.location.hash.slice(1);
		if (!id) return;
		recipeView.renderSpinner();
		//Update Results view to mark the selected
		resultsView.update(model.getSearchResultsPage());
		bookmarksView.update(model.state.bookmarks);
		//1. Loading the recipe
		await model.loadRecipe(id);

		//2. Rendering the recipe
		recipeView.render(model.state.recipe);
	} catch (error) {
		recipeView.renderError();
	}
};

const controlSearchResults = async function () {
	resultsView.renderSpinner();
	const query = searchView.getQuery();

	if (!query) return;

	try {
		await model.loadSearchResults(query);
		// console.log(model.state.search);
		// resultsView.render(model.state.search.results);
		resultsView.render(model.getSearchResultsPage());
		paginationView.render(model.state.search);
	} catch (error) {
		console.log(error);
	}
};

const controllerPagination = function (goToPage) {
	resultsView.render(model.getSearchResultsPage(goToPage));
	paginationView.render(model.state.search);
};

const controlServing = function (newServings) {
	model.updateServings(newServings);
	recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
	if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
	else model.removeBookmark(model.state.recipe.id);
	// console.log(model.state.recipe);
	recipeView.update(model.state.recipe);

	bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
	bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
	try {
		addRecipeView.renderSpinner();

		await model.uploadRecipe(newRecipe);

		recipeView.render(model.state.recipe);

		addRecipeView.renderMessage();

		bookmarksView.render(model.state.bookmarks);

		window.history.pushState(null, '', `#${model.state.recipe.id}`);

		setTimeout(function () {
			addRecipeView.toggleWindow();
		}, 2500);
	} catch (error) {
		addRecipeView.renderError(error.message);
	}
};

const init = function () {
	bookmarksView.addHandlerRender(controlBookmarks);
	recipeView.addHandlerRender(controlRecipes);
	recipeView.addHandlerServings(controlServing);
	recipeView.addHandlerAddBookmark(controlAddBookmark);
	searchView.addHandlerSearch(controlSearchResults);
	paginationView.addHandlerClick(controllerPagination);
	addRecipeView.addHandlerUpload(controlAddRecipe);
};
init();
