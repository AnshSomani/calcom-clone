const express = require('express');
const router = express.Router();
const { getAvailability, updateAvailability, createAvailability, deleteAvailability } = require('../controllers/availabilityController');

router.get('/', getAvailability);
router.put('/', updateAvailability);
router.post('/', createAvailability);
router.delete('/:id', deleteAvailability);

module.exports = router;
