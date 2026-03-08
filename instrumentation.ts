export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Starting Wafie Console...');
    console.log('📡 WAFIE_API_HOST:', process.env.WAFIE_API_HOST || '(not set)');
    console.log('📝 Logging enabled for access and errors');

    // Global error handlers
    process.on('uncaughtException', (error) => {
      console.error('❌ [UNCAUGHT EXCEPTION]', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ [UNHANDLED REJECTION]', reason);
    });

    console.log('✅ Error handlers registered');
  }
}
