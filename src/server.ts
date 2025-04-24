/**
 * WALEMCP API Server
 * Provides HTTP API access to MCP functionality
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MCP } from './core/mcp';
import config from './config';
import { Logger } from './utils/logger';

const logger = new Logger(config.logging.level as any);

/**
 * Start the API server
 * @param mcp MCP instance
 * @param port Port to listen on
 */
export async function startServer(mcp: MCP, port: number = config.server.port): Promise<any> {
  const app = express();
  
  // Middleware
  app.use(cors({
    origin: config.server.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
  
  // API routes
  const apiRouter = express.Router();
  
  // Root endpoint
  apiRouter.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'WALEMCP API',
      version: '1.0.0',
      status: 'online'
    });
  });
  
  // Templates endpoints
  apiRouter.get('/templates', async (req: Request, res: Response) => {
    try {
      const criteria = req.query;
      const templates = await mcp.searchTemplates(criteria as any);
      res.json({ success: true, templates });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch templates'
      });
    }
  });
  
  apiRouter.post('/templates', async (req: Request, res: Response) => {
    try {
      const { template, creatorId } = req.body;
      
      if (!template || !creatorId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: template or creatorId'
        });
      }
      
      const templateId = await mcp.registerTemplate(template, creatorId);
      
      res.json({
        success: true,
        templateId,
        message: 'Template registered successfully'
      });
    } catch (error) {
      logger.error('Error registering template:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to register template'
      });
    }
  });
  
  // Task execution endpoint
  apiRouter.post('/execute', async (req: Request, res: Response) => {
    try {
      const { templateId, inputs, userId } = req.body;
      
      if (!templateId || !inputs || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: templateId, inputs, or userId'
        });
      }
      
      // Fetch template
      const templates = await mcp.searchTemplates({ id: templateId });
      
      if (!templates || templates.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Template not found: ${templateId}`
        });
      }
      
      // Execute task
      const result = await mcp.executeTask(templates[0], inputs, userId);
      
      res.json({
        success: true,
        taskId: result.taskId,
        status: result.status,
        outputs: result.outputs,
        metadata: result.metadata
      });
    } catch (error) {
      logger.error('Error executing task:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute task'
      });
    }
  });
  
  // Health check endpoint
  apiRouter.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
  
  // Mount API router
  app.use(`/api/${config.server.apiVersion}`, apiRouter);
  
  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', err);
    
    res.status(500).json({
      success: false,
      error: config.isProduction ? 'Internal server error' : err.message,
      stack: config.isProduction ? undefined : err.stack
    });
  });
  
  // Start server
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      logger.info(`WALEMCP API server running on port ${port}`);
      resolve(server);
    });
    
    server.on('error', (error) => {
      logger.error('Server startup error:', error);
      reject(error);
    });
  });
} 