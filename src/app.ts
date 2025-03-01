import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import contactRoutes from './routes/contactRoutes';
import logger from './utils/logger';
import { ensureRequiredDirectories } from './utils/ensureDirectories';

const app = express();

// Ensure required directories exist
ensureRequiredDirectories()
  .then(() => {
    logger.info('Application directories verified');
  })
  .catch((error) => {
    logger.error('Failed to verify directories:', error);
    process.exit(1);
  });

// Load OpenAPI specification
const openapiDocument = YAML.load('./src/openapi.yaml');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from uploads directory using absolute path
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// OpenAPI documentation route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// API routes
app.use('/contacts', contactRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
