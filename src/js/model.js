import { API_URL, RESULTS_PER_PAGE, KEY } from './config';
// import { getJSON, sendJSON } from './helpers';
import { AJAX } from './helpers';
export const state = {
	recipe: {},
	search: {
		query: '',
		results: [],
		page: 1,
		resultsPerPage: RESULTS_PER_PAGE,
	},
	bookmarks: [],
};

const createRecipeObject = function (data) {
	const { recipe } = data.data;
	return {
		id: recipe.id,
		title: recipe.title,
		publisher: recipe.publisher,
		servings: recipe.servings,
		sourceUrl: recipe.source_url,
		image: recipe.image_url,
		cookingTime: recipe.cooking_time,
		ingredients: recipe.ingredients,
		...(recipe.key && { key: recipe.key }),
	};
};

export const loadRecipe = async function (id) {
	try {
		const data = await AJAX(`${API_URL}${id}?key=${KEY}`);

		state.recipe = createRecipeObject(data);
		// console.dir(state.recipe);

		if (state.bookmarks.some(bookmark => bookmark.id === id))
			state.recipe.bookmarked = true;
		else state.recipe.bookmarked = false;
	} catch (error) {
		throw error;
	}
};

export const loadSearchResults = async function (query) {
	try {
		state.search.query = query;
		const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);

		state.search.results = data.data.recipes.map(recipe => {
			return {
				id: recipe.id,
				title: recipe.title,
				publisher: recipe.publisher,
				image: recipe.image_url,
				...(recipe.key && { key: recipe.key }),
			};
		});
		state.search.page = 1;
	} catch (error) {
		throw error;
	}
};

export const getSearchResultsPage = function (page = state.search.page) {
	state.search.page = page;

	const start = (page - 1) * state.search.resultsPerPage;
	const end = page * state.search.resultsPerPage;
	return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
	state.recipe.ingredients.forEach(ing => {
		ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
	});
	state.recipe.servings = newServings;
};

const persistBookmarks = function () {
	localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

const clearBookmarks = function () {
	localStorage.clear('bookmarks');
};

export const addBookmark = function (recipe) {
	state.bookmarks.push(recipe);

	if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
	persistBookmarks();
};
export const removeBookmark = function (id) {
	const index = state.bookmarks.findIndex(el => el.id === id);
	state.bookmarks.splice(index, 1);

	if (id === state.recipe.id) state.recipe.bookmarked = false;
	persistBookmarks();
};

const init = function () {
	const storage = localStorage.getItem('bookmarks');
	if (storage) state.bookmarks = JSON.parse(storage);
};
init();

export const uploadRecipe = async function (newRecipe) {
	try {
		const ingredients = Object.entries(newRecipe)
			.filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
			.map(ingredient => {
				const ingArr = ingredient[1].split(',').map(ing => ing.trim());
				if (ingArr.length !== 3)
					throw new Error(
						'Wrong ingredient format. Pls use correct formate and try again :)'
					);
				const [quantity, unit, description] = ingArr;
				return { quantity: quantity ? +quantity : null, unit, description };
			});
		const recipe = {
			id: newRecipe.id,
			title: newRecipe.title,
			publisher: newRecipe.publisher,
			servings: +newRecipe.servings,
			source_url: newRecipe.sourceUrl,
			image_url: newRecipe.image,
			cooking_time: +newRecipe.cookingTime,
			ingredients,
		};

		const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
		state.recipe = createRecipeObject(data);
		addBookmark(state.recipe);
	} catch (error) {
		throw error;
	}
};
