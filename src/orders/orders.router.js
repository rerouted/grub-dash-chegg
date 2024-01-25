const router = require('express').Router()
const controller = require('./orders.controller')
const methodNotAllowed = require('../errors/methodNotAllowed')

// TODO: Implement the /orders routes needed to make the tests pass
// In the src/orders/orders.router.js file, add two routes: /orders and /orders/:orderId. Attach the handlers (create, read, update, delete, and list) exported from src/orders/orders.controller.js.

// PATH /orders
router
	.route('/:orderId')
	.get(controller.read)
	.put(controller.update)
	.delete(controller.delete)
	.all(methodNotAllowed)
router
	.route('/')
	.get(controller.list)
	.post(controller.create)
	.all(methodNotAllowed)

module.exports = router
