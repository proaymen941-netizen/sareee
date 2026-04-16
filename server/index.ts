import dotenv from 'dotenv';
dotenv.config({ override: false }); // Don't override existing env vars (Replit secrets take priority)
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupWebSockets } from "./socket";
import { registerBroadcast } from "./broadcast";
import { setupVite, serveStatic, log } from "./viteServer";
import { seedDefaultData, ensureDefaultSettings } from "./seed";
import { storage } from "./storage";

const app = express();

// Enable gzip compression for all responses - major performance improvement
app.use(compression({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6,        // Balanced compression level
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

// Disable ETag caching to fix special offers not updating
app.set('etag', false);

// Smart caching for API routes
app.use('/api', (req, res, next) => {
  // Disable cache for mutation requests and auth-sensitive endpoints
  if (req.method !== 'GET') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else if (req.path.includes('/special-offers') || req.path.includes('/settings')) {
    // Short cache for frequently changing public data
    res.set('Cache-Control', 'public, max-age=30');
  }
  next();
});

// Lightweight request logger (no JSON capture overhead)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Setup WebSockets
    const ws = setupWebSockets(server);
    app.set('ws', ws);
    registerBroadcast(ws.broadcast);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Seed database with default data if using DatabaseStorage
    if (storage.constructor.name === 'DatabaseStorage') {
      log('🌱 Seeding database with default data...');
      await seedDefaultData();
      // ضمان وجود جميع إعدادات الواجهة الافتراضية (يعمل عند كل تشغيل)
      await ensureDefaultSettings();
    }

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });

    // ===== مؤقت تفعيل الطلبات المجدولة =====
    // كل دقيقة: ابحث عن طلبات scheduled موعدها خلال 30 دقيقة أو أقل وفعّلها
    setInterval(async () => {
      try {
        const allOrders = await storage.getOrders();
        const scheduledOrders = allOrders.filter((o: any) => o.status === 'scheduled');
        if (scheduledOrders.length === 0) return;

        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        for (const order of scheduledOrders) {
          if (!order.scheduledDate || !order.scheduledTimeSlot) continue;
          try {
            // parse scheduledDate (YYYY-MM-DD) + scheduledTimeSlot (HH:MM)
            const timeStr = order.scheduledTimeSlot.replace(/[^\d:]/g, '').trim();
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) continue;

            const scheduledDateTime = new Date(order.scheduledDate);
            scheduledDateTime.setHours(hours, minutes, 0, 0);

            // إذا كان الموعد خلال 30 دقيقة أو قد فات وقته
            if (scheduledDateTime <= thirtyMinutesFromNow) {
              await storage.updateOrder(order.id, {
                status: 'pending',
                updatedAt: new Date()
              });

              // إشعار للإدارة
              await storage.createNotification({
                type: 'scheduled_order_ready',
                title: '📅 طلب مجدول جاهز',
                message: `الطلب المجدول رقم ${order.orderNumber} من ${order.customerName} أصبح جاهزاً للتوصيل. موعده: ${order.scheduledDate} ${order.scheduledTimeSlot}`,
                recipientType: 'admin',
                recipientId: null,
                orderId: order.id,
                isRead: false
              });

              // إشعار للعميل
              await storage.createNotification({
                type: 'order_status_update',
                title: 'طلبك المجدول قيد التنفيذ',
                message: `بدأ تجهيز طلبك المجدول رقم ${order.orderNumber} - سيصلك قريباً`,
                recipientType: 'customer',
                recipientId: order.customerId || order.customerPhone,
                orderId: order.id,
                isRead: false
              });

              // تتبع
              await storage.createOrderTracking({
                orderId: order.id,
                status: 'pending',
                message: `تم تفعيل الطلب المجدول تلقائياً - موعد التوصيل: ${order.scheduledDate} ${order.scheduledTimeSlot}`,
                createdBy: 'system',
                createdByType: 'system'
              });

              // WebSocket broadcast
              const wsServer = app.get('ws');
              if (wsServer) {
                wsServer.broadcast('order_update', { orderId: order.id, status: 'pending', type: 'scheduled_activated' });
              }

              log(`✅ تم تفعيل الطلب المجدول: ${order.orderNumber}`);
            }
          } catch (e) {
            console.error(`خطأ في تفعيل الطلب المجدول ${order.id}:`, e);
          }
        }
      } catch (e) {
        console.error('خطأ في مؤقت الطلبات المجدولة:', e);
      }
    }, 60 * 1000); // كل دقيقة
    log('⏰ تم تشغيل مؤقت الطلبات المجدولة');

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();