const path = require('path')

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'))

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId')

//validators
function orderExists(req, res, next) {
	const { orderId } = req.params
	const foundOrder = orders.find((order) => order.id === orderId)

	if (foundOrder) {
		res.locals.order = foundOrder
		res.locals.orderId = orderId
		return next()
	}

	return next({
		status: 404,
		message: `Order Id ${orderId} does not exist`,
	})
}

function checkIfPending(req, res, next) {
	const order = res.locals.order

	if (order.status !== 'pending') {
		return next({
			status: 400,
			message: 'Only pending orders can be deleted',
		})
	}

	return next()
}

function validateOrderProps(req, res, next) {
	const { data = {} } = req.body
	const reqBody = data

	// Validation for 'deliverTo' prop
	if (!reqBody.deliverTo) {
		return next({
			status: 400,
			message: 'Order must include a deliverTo',
		})
	}

	// Validation for 'mobileNumber' prop
	if (!reqBody.mobileNumber) {
		return next({
			status: 400,
			message: 'Order must include a mobileNumber',
		})
	}

	// Validation for 'dishes' prop
	if (
		!reqBody.dishes ||
		!reqBody.dishes.length ||
		!Array.isArray(reqBody.dishes)
	) {
		return next({
			status: 400,
			message: 'Order must include < 1 dish',
		})
	}

	// Validation for 'dish.quantity' prop
	if (
		!reqBody.dishes ||
		!reqBody.dishes.length ||
		!Array.isArray(reqBody.dishes)
	) {
		return next({
			status: 400,
			message: 'Order must include < 1 dish',
		})
	}

	res.locals.validatedOrderData = reqBody
	return next()
}

function idsMatch(req, res, next) {
	const orderId = res.locals.orderId
	const validatedOrderData = res.locals.validatedOrderData

	if (validatedOrderData.id && validatedOrderData.id !== res.locals.orderId) {
		return next({
			status: 400,
			message: `Order-Route id mis-match. Order Id: ${orderId}, Route Id: ${validatedOrderData.id}`,
		})
	}

	return next()
}

function hasValidStatus(req, res, next) {
	const order = res.locals.validatedOrderData

	if (!order.status || order.status === 'invalid') {
		next({
			status: 400,
			message: 'Order must have a status must be valid',
		})
	}

	return next()
}

function checkDishQtyProp(req, res, next) {
	const order = res.locals.validatedOrderData

	const invalidIndexes = order.dishes.reduce((acc, dish, index) => {
		if (
			!dish.quantity ||
			dish.quantity <= 0 ||
			typeof dish.quantity !== 'number'
		) {
			acc.push(index)
		}
		return acc
	}, [])

	if (invalidIndexes.length === 0) {
		return next()
	}

	const errorMessage =
		invalidIndexes.length > 1
			? `Dishes ${invalidIndexes.join(', ')} must have a quantity > 0`
			: `Dish ${invalidIndexes} must have a quantity > 0`

	next({
		status: 400,
		message: errorMessage,
	})
}

// --- begin end-points ---
function read(req, res, next) {
	res.json({ data: res.locals.order })
}

function list(req, res) {
	res.json({ data: orders })
}

function create(req, res) {
	const newOrder = {
		...res.locals.validatedOrderData,
		id: nextId(),
	}

	orders.push(newOrder)

	res.status(201).json({ data: newOrder })
}

function update(req, res) {
	const order = res.locals.order
	const orderToUpdate = res.locals.validatedOrderData

	Object.keys(orderToUpdate).forEach((key) => {
		if (key !== 'id' && order[key] !== orderToUpdate[key]) {
			order[key] = orderToUpdate[key]
		}
	})

	res.json({ data: order })
}

function destroy(req, res) {
	const orderId = res.locals.orderId
	const orderIndex = orders.findIndex((order) => order.id === orderId)
	orders.splice(orderIndex, 1)
	res.sendStatus(204)
}

module.exports = {
	read: [orderExists, read],
	create: [validateOrderProps, checkDishQtyProp, create],
	update: [
		orderExists,
		validateOrderProps,
		hasValidStatus,
		checkDishQtyProp,
		idsMatch,
		update,
	],
	delete: [orderExists, checkIfPending, destroy],
	list,
}
