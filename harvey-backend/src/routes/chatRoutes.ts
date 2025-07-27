import { Router } from 'express';
import multer = require('multer');
import * as path from 'path';
import * as fs from 'fs';
import { ChatController } from '../controllers/chatController';

const router = Router();
const chatController = new ChatController();

const uploadsDir = path.join(__dirname, '../../uploads/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Directorio uploads creado: ${uploadsDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.yaml', '.yml'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos YAML (.yaml, .yml)'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});

/**
 * @route POST /api/chat/session
 * @desc Create a new chat session
 * @access Public
 */
router.post('/session', chatController.createSession.bind(chatController));

/**
 * @route POST /api/chat/session/:sessionId/upload
 * @desc Upload a YAML file to the session
 * @access Public
 */
router.post('/session/:sessionId/upload', upload.single('file'), chatController.uploadFile.bind(chatController));

/**
 * @route POST /api/chat/session/:sessionId/message
 * @desc Send a message to HARVEY
 * @access Public
 */
router.post('/session/:sessionId/message', chatController.sendMessage.bind(chatController));

/**
 * @route GET /api/chat/session/:sessionId
 * @desc Get session information
 * @access Public
 */
router.get('/session/:sessionId', chatController.getSession.bind(chatController));

/**
 * @route GET /api/chat/session/:sessionId/messages
 * @desc Get messages from the session
 * @access Public
 */
router.get('/session/:sessionId/messages', chatController.getMessages.bind(chatController));

/**
 * @route GET /api/chat/session/:sessionId/files
 * @desc Get files from the session
 * @access Public
 */
router.get('/session/:sessionId/files', chatController.getSessionFiles.bind(chatController));

/**
 * @route PUT /api/chat/session/:sessionId/pricing-context
 * @desc Update the pricing context with a specific file
 * @access Public
 */
router.put('/session/:sessionId/pricing-context', chatController.updatePricingContext.bind(chatController));

/**
 * @route DELETE /api/chat/session/:sessionId/pricing-context
 * @desc Clear the current pricing context
 * @access Public
 */
router.delete('/session/:sessionId/pricing-context', chatController.clearPricingContext.bind(chatController));

/**
 * @route GET /api/chat/session/:sessionId/pricing-context
 * @desc Get information about the current pricing context
 * @access Public
 */
router.get('/session/:sessionId/pricing-context', chatController.getPricingContextInfo.bind(chatController));

/**
 * @route DELETE /api/chat/session/:sessionId
 * @desc Delete the entire session
 * @access Public
 */
router.delete('/session/:sessionId', chatController.deleteSession.bind(chatController));

export default router;
