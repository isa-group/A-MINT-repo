import app = require('./app');
import { config } from './config';
import { ChatController } from './controllers/chatController';
import { SchedulerService } from './services/schedulerService';

const PORT = config.port || 3000;

const chatController = new ChatController();
const schedulerService = new SchedulerService(chatController);

const server = app.listen(PORT, () => {
  console.log(`
  🚀 HARVEY Backend Server started successfully!

  📡 Port: ${PORT}
  🌍 Environment: ${config.nodeEnv}
  🔗 API Base URL: http://localhost:${PORT}/api
  🏥 Health Check: http://localhost:${PORT}/health

  📚 Available Endpoints:
  • POST /api/chat/session - Initialize session
  • POST /api/chat - Send message to HARVEY
  • GET  /api/chat/session/:sessionId - Get session status
  • GET  /api/chat/session/:sessionId/files - Get session files
  • DELETE /api/chat/session/:sessionId/files/:fileId - Delete file
  • DELETE /api/chat/session/:sessionId - Delete session

  💡 HARVEY is ready to assist with price analysis!
  `);

  schedulerService.startScheduledTasks();
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🔄 Initiating graceful shutdown of the server...');

  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Forcing server shutdown...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default server;
