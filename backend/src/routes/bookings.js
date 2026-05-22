const express = require('express');
const router = express.Router();
const { listBookings, getBooking, cancelBooking } = require('../controllers/bookingsController');

router.get('/', listBookings);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
