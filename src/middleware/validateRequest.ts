import { ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    logger.warn('Validation error', { errors: errors.array() });
    res.status(400).json({
      errors: errors.array()
    });
  };
}; 