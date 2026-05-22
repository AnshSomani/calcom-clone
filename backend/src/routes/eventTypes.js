const express = require('express');
const router = express.Router();
const {
  listEventTypes, getEventType, createEventType,
  updateEventType, deleteEventType, toggleEventType
} = require('../controllers/eventTypesController');

router.get('/', listEventTypes);
router.get('/:id', getEventType);
router.post('/', createEventType);
router.put('/:id', updateEventType);
router.delete('/:id', deleteEventType);
router.patch('/:id/toggle', toggleEventType);

module.exports = router;
