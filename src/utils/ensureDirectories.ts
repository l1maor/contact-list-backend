import fs from 'fs';
import path from 'path';
import logger from './logger';

const REQUIRED_DIRECTORIES = ['logs', 'uploads'] as const;

export const ensureRequiredDirectories = async (): Promise<void> => {
  try {
    for (const dir of REQUIRED_DIRECTORIES) {
      const dirPath = path.join(process.cwd(), dir);
      
      try {
        await fs.promises.access(dirPath);
        logger.info(`Directory exists: ${dir}`);
      } catch (error) {
        logger.info(`Creating directory: ${dir}`);
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
    }
    logger.info('All required directories are ready');
  } catch (error) {
    logger.error('Failed to create required directories:', error);
    throw new Error('Failed to create required directories');
  }
};
