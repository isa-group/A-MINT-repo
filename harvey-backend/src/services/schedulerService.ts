import cron from 'node-cron';
import { ChatController } from '../controllers/chatController';

export class SchedulerService {
  private chatController: ChatController;

  constructor(chatController: ChatController) {
    this.chatController = chatController;
  }

  public startScheduledTasks(): void {
    this.startSessionCleanup();
    console.log('📅 Scheduled tasks started');
  }

  private startSessionCleanup(): void {
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('🧹 Starting cleanup of inactive sessions...');
        await this.chatController.cleanupInactiveSessions();
        console.log('✅ Cleanup of sessions completed');
      } catch (error) {
        console.error('❌ Error in session cleanup:', error);
      }
    }, {
      timezone: 'America/Mexico_City' // Adjust according to your timezone
    });

    console.log('🗑️  Automatic cleanup of sessions scheduled (every hour)');
  }

  public stopScheduledTasks(): void {
    // Note: node-cron doesn't provide a direct way to get all tasks
    // We would need to keep references to the tasks if we wanted to stop them
    console.log('⏹️  Scheduled tasks stopped');
  }
}
