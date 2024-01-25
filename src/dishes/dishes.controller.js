const path = require('path')

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'))

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId')

//validators
function dishExists(req, res, next) {
	const { dishId } = req.params
	const foundDish = dishes.find((dish) => dish.id === dishId)

	if (foundDish) {
		res.locals.dish = foundDish
		res.locals.dishId = dishId
		return next()
	}

	return next({
		status: 404,
		message: `Dish does not exist: ${dishId}.`,
	})
}

function idsMatch(req, res, next) {
	const dishId = res.locals.dishId
	const validatedDishData = res.locals.validatedDishData

	if (validatedDishData.id && validatedDishData.id !== res.locals.dishId) {
		return next({
			status: 400,
			message: `Dish-Route id mis-match. Dish Id: ${dishId}, Route Id: ${validatedDishData.id}`,
		})
	}

	return next()
}

function validateDishProperties(req, res, next) {
	const { data = {} } = req.body
	const reqBody = data

	// Validation for 'name' property
	if (!reqBody.name) {
		return next({
			status: 400,
			message: 'Dish must include a name.',
		})
	}

	// Validation for 'description' property
	if (!reqBody.description) {
		return next({
			status: 400,
			message: 'Dish must include a description.',
		})
	}

	// Validation for 'price' property
	if (
		!reqBody.price ||
		reqBody.price < 0 ||
		typeof reqBody.price !== 'number'
	) {
		return next({
			status: 400,
			message:
				'Dish must include a price, and it must be a number greater than or equal to 0.',
		})
	}

	// Validation for 'image_url' property
	if (!reqBody.image_url) {
		return next({
			status: 400,
			message: 'Dish must include an image_url.',
		})
	}

	res.locals.validatedDishData = reqBody
	return next()
}

function read(req, res, next) {
	res.json({ data: res.locals.dish })
}

function list(req, res) {
	const { dishId } = req.params
	res.json({
		data: dishes.filter(dishId ? (dish) => dish.id == dishId : () => true),
	})
}

function create(req, res) {
	const newDish = {
		...res.locals.validatedDishData,
		id: nextId(),
	}

	dishes.push(newDish)

	res.status(201).json({ data: newDish })
}

// function update(req, res) {
// 	const dish = res.locals.dish
// 	const dishToUpdate = { ...res.locals.validatedDishData }

// 	res.locals.dish = { ...dish, ...dishToUpdate }
// 	res.json({ data: res.locals.dish })
// }

function update(req, res) {
	const dish = res.locals.dish
	const dishToUpdate = { ...res.locals.validatedDishData }

	// Update the original dish object with values from dishToUpdate, excluding properties with null values
	Object.keys(dishToUpdate).forEach((key) => {
		if (dishToUpdate[key] !== null) {
			dish[key] = dishToUpdate[key]
		}
	})

	res.json({ data: dish })
}

module.exports = {
	read: [dishExists, read],
	create: [validateDishProperties, create],
	update: [dishExists, validateDishProperties, idsMatch, update],
	list,
}
