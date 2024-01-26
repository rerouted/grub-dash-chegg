const path = require('path')

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'))

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId')

//validator functions

function dishFound(request, response, next) {
	const { dishId } = request.params
	const foundDish = dishes.find((dish) => dish.id === dishId)

	if (foundDish) {
		response.locals.dish = foundDish
		response.locals.dishId = dishId
		return next()
	}

	return next({
		status: 404,
		message: `Dish not found: ${dishId}.`,
	})
}

function idsMatch(request, response, next) {
	const dishId = response.locals.dishId
	const reqBody = response.locals.reqBody

	if (reqBody.id && reqBody.id !== response.locals.dishId) {
		return next({
			status: 400,
			message: `Dish-Route id mis-match. Dish Id: ${dishId}, Route Id: ${reqBody.id}`,
		})
	}

	return next()
}

// must be called first to ref response.locals.reqBody
function hasNameProp(request, response, next) {
	const { data = {} } = request.body
	const reqBody = data
	response.locals.reqBody = reqBody

	if (!reqBody.name) {
		return next({
			status: 400,
			message: 'Dish must include name',
		})
	}
	return next()
}

function hasDescriptionProp(request, response, next) {
	const reqBody = response.locals.reqBody

	if (!reqBody.description) {
		return next({
			status: 400,
			message: 'Dish must include description',
		})
	}
	return next()
}

function hasPriceProp(request, response, next) {
	const reqBody = response.locals.reqBody

	if (
		!reqBody.price ||
		reqBody.price < 0 ||
		typeof reqBody.price !== 'number'
	) {
		return next({
			status: 400,
			message: 'Dish must include a price, numeral and < 0',
		})
	}
	return next()
}

function hasImageProp(request, response, next) {
	const reqBody = response.locals.reqBody
	if (!reqBody.image_url) {
		return next({
			status: 400,
			message: 'Dish must include image_url',
		})
	}

	return next()
}

function read(request, response, next) {
	response.json({ data: response.locals.dish })
}

function list(request, response) {
	response.json({ data: dishes })
}

function create(request, response) {
	const newDish = {
		...response.locals.reqBody,
		id: nextId(),
	}
	dishes.push(newDish)
	response.status(201).json({ data: newDish })
}

function update(request, response) {
	const dish = response.locals.dish
	const dishToUpdate = { ...response.locals.reqBody }

	Object.keys(dishToUpdate).forEach((key) => {
		if (dishToUpdate[key] !== null) {
			dish[key] = dishToUpdate[key]
		}
	})

	response.json({ data: dish })
}

module.exports = {
	read: [dishFound, read],
	create: [hasNameProp, hasDescriptionProp, hasPriceProp, hasImageProp, create],
	update: [
		dishFound,
		hasNameProp,
		hasDescriptionProp,
		hasPriceProp,
		hasImageProp,
		idsMatch,
		update,
	],
	list,
}
