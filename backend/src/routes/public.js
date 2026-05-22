const express = require('express');
const router = express.Router();
const {
  getPublicEventType, getAvailableDates, getAvailableSlots,
  createBooking, rescheduleBooking, getBookingByUid,
} = require('../controllers/publicController');

router.get('/booking/:uid', getBookingByUid);
router.post('/booking/:uid/reschedule', rescheduleBooking);
router.get('/:username/:slug', getPublicEventType);
router.get('/:username/:slug/available-dates', getAvailableDates);
router.get('/:username/:slug/slots', getAvailableSlots);
router.post('/:username/:slug/book', createBooking);

module.exports = router;
