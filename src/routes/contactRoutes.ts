import express from 'express';
import * as contactController from '../controllers/contactController';
import { validate } from '../middleware/validateRequest';
import {
  createContactValidator,
  updateContactValidator,
  searchContactValidator,
  deleteContactValidator,
  getContactValidator,
} from '../validators/contactValidators';

const router = express.Router();

router.get('/', validate(searchContactValidator), contactController.getContacts);
router.get('/:id', validate(getContactValidator), contactController.getContactById);
router.post('/', validate(createContactValidator), contactController.createContact);
router.put('/:id', validate(updateContactValidator), contactController.updateContact);
router.delete('/:id', validate(deleteContactValidator), contactController.deleteContact);

export default router;
