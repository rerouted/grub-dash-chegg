const path = require('path')

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'))

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId')

//validator functions
function orderFound(request, response, next) {
	const { orderId } = request.params
	const foundOrder = orders.find((order) => order.id === orderId)

	if (foundOrder) {
		response.locals.order = foundOrder
		response.locals.orderId = orderId
		return next()
	}

	return next({
		status: 404,
		message: `Order Id ${orderId} not found`,
	})
}

function isPending(request, response, next) {
	const order = response.locals.order

	if (order.status !== 'pending') {
		return next({
			status: 400,
			message: 'Only pending orders can be deleted',
		})
	}

	return next()
}

// must be called first to ref response.locals.reqBody
function hasDeliverToProp(request, response, next) {
	const { data = {} } = request.body
	const reqBody = data
	response.locals.reqBody = reqBody

	// Validation for 'deliverTo' prop
	if (!reqBody.deliverTo) {
		return next({
			status: 400,
			message: 'Order must include a deliverTo',
		})
	}

	return next()
}

function hasMobileNumberProp(request, response, next) {
	const reqBody = response.locals.reqBody
	if (!reqBody.mobileNumber) {
		return next({
			status: 400,
			message: 'Order must include a mobileNumber',
		})
	}
	return next()
}

function hasDishesProp(request, response, next) {
	const reqBody = response.locals.reqBody
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
	return next()
}

function idsMatch(request, response, next) {
	const orderId = response.locals.orderId
	const reqBody = response.locals.reqBody

	if (reqBody.id && reqBody.id !== response.locals.orderId) {
		return next({
			status: 400,
			message: `Order-Route id mis-match. Order Id: ${orderId}, Route Id: ${reqBody.id}`,
		})
	}

	return next()
}

function hasValidStatus(request, response, next) {
	const order = response.locals.reqBody

	if (!order.status || order.status === 'invalid') {
		next({
			status: 400,
			message: 'Order must have a status must be valid',
		})
	}

	return next()
}

function checkDishQtyProp(request, response, next) {
	const order = response.locals.reqBody

	const invalidIndexes = order.dishes.reduce((dishArray, dish, index) => {
		if (
			!dish.quantity ||
			dish.quantity <= 0 ||
			typeof dish.quantity !== 'number'
		) {
			dishArray.push(index)
		}
		return dishArray
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
function read(request, response, next) {
	response.json({ data: response.locals.order })
}

function list(request, response) {
	response.json({ data: orders })
}

function create(request, response) {
	const newOrder = {
		...response.locals.reqBody,
		id: nextId(),
	}

	orders.push(newOrder)

	response.status(201).json({ data: newOrder })
}

function update(request, response) {
	const order = response.locals.order
	const orderToUpdate = response.locals.reqBody

	Object.keys(orderToUpdate).forEach((key) => {
		if (key !== 'id' && order[key] !== orderToUpdate[key]) {
			order[key] = orderToUpdate[key]
		}
	})

	response.json({ data: order })
}

function destroy(request, response) {
	const orderId = response.locals.orderId
	const orderIndex = orders.findIndex((order) => order.id === orderId)
	orders.splice(orderIndex, 1)
	response.sendStatus(204)
}

module.exports = {
	read: [orderFound, read],
	create: [
		hasDeliverToProp,
		hasMobileNumberProp,
		hasDishesProp,
		checkDishQtyProp,
		create,
	],
	update: [
		orderFound,
		hasDeliverToProp,
		hasMobileNumberProp,
		hasDishesProp,
		hasValidStatus,
		checkDishQtyProp,
		idsMatch,
		update,
	],
	delete: [orderFound, isPending, destroy],
	list,
}
