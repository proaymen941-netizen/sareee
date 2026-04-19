import express from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertDriverSchema } from "@shared/schema";
import { coerceRequestData } from "../utils/coercion";
import { requireDriverAuth, AuthenticatedRequest } from "../utils/auth-middleware";
import { AdvancedDatabaseStorage } from "../db-advanced";

const router = express.Router();

// ================================================================
// المسارات العامة (للإدارة - لا تتطلب توكن سائق)
// ================================================================

// جلب جميع السائقين
router.get("/", async (req, res) => {
  try {
    const { available } = req.query;
    let drivers;
    if (available === 'true') {
      drivers = await storage.getAvailableDrivers();
    } else {
      drivers = await storage.getDrivers();
    }
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// إنشاء سائق جديد (من لوحة التحكم)
router.post("/", async (req, res) => {
  try {
    const validatedData = insertDriverSchema.parse(req.body);
    const driver = await storage.createDriver(validatedData);
    res.status(201).json(driver);
  } catch (error) {
    console.error("خطأ في إضافة سائق:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "بيانات السائق غير صحيحة",
        details: error.errors
      });
    }
    res.status(400).json({
      message: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة السائق"
    });
  }
});

// ================================================================
// مسارات تطبيق السائق المحمية (تتطلب توكن سائق)
// ملاحظة مهمة: يجب تعريف المسارات المحددة قبل مسارات الـ wildcard
// ================================================================

// لوحة معلومات السائق
router.get("/app/dashboard", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json({ error: "السائق غير موجود" });
    }

    const allOrders = await storage.getOrders();
    const driverOrders = allOrders.filter(order => order.driverId === driverId);

    const driverBalance = await storage.getDriverBalance(driverId);
    const driverCommissions = await storage.getDriverCommissions(driverId);

    const advStorage = new AdvancedDatabaseStorage(storage.db);
    const driverReviews = await advStorage.getDriverReviews(driverId);

    const todayStr = new Date().toDateString();

    const todayOrders = driverOrders.filter(order => {
      try {
        const createdDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
        return createdDate.toDateString() === todayStr;
      } catch (e) {
        return false;
      }
    });
    const completedToday = todayOrders.filter(order => order.status === "delivered");

    const commissionsToday = driverCommissions.filter(commission => {
      try {
        const createdDate = commission.createdAt instanceof Date ? commission.createdAt : new Date(commission.createdAt);
        return createdDate.toDateString() === todayStr;
      } catch (e) {
        return false;
      }
    });
    const todayEarnings = commissionsToday.reduce((sum, commission) =>
      sum + (parseFloat(commission.commissionAmount?.toString()) || 0), 0
    );

    const totalEarnings = driverCommissions.reduce((sum, commission) =>
      sum + (parseFloat(commission.commissionAmount?.toString()) || 0), 0
    );

    const availableOrders = allOrders
      .filter(order => (order.status === "confirmed" || order.status === "assigned") && order.driverId === driverId)
      .slice(0, 10);

    const currentOrders = driverOrders.filter(order =>
      ["preparing", "ready", "picked_up", "on_way"].includes(order.status)
    );

    res.json({
      stats: {
        todayOrders: todayOrders.length,
        todayEarnings,
        completedToday: completedToday.length,
        totalOrders: driverOrders.length,
        totalEarnings,
        availableBalance: parseFloat(driverBalance?.availableBalance?.toString() || "0"),
        withdrawnAmount: parseFloat(driverBalance?.withdrawnAmount?.toString() || "0"),
        totalCommissions: driverCommissions.length,
        averageRating: parseFloat(driver.averageRating?.toString() || "4.5")
      },
      driver: {
        id: driver.id,
        name: driver.name,
        isAvailable: driver.isAvailable,
        isActive: driver.isActive
      },
      availableOrders,
      currentOrders,
      reviews: driverReviews || [],
      balance: driverBalance || {
        availableBalance: "0",
        totalBalance: "0",
        withdrawnAmount: "0",
        pendingAmount: "0"
      }
    });
  } catch (error) {
    console.error("خطأ في لوحة معلومات السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب الطلبات المتاحة (قبل /orders لأنه أكثر تحديداً)
router.get("/orders/available", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const allOrders = await storage.getOrders();

    const availableOrders = allOrders.filter(order =>
      (order.status === "confirmed" || order.status === "assigned") &&
      order.driverId === driverId
    );

    availableOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json(availableOrders);
  } catch (error) {
    console.error("خطأ في جلب الطلبات المتاحة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب طلبات السائق (فلترة حسب الحالة)
router.get("/orders", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const { status } = req.query;

    const allOrders = await storage.getOrders();
    let driverOrders = allOrders.filter(order => order.driverId === driverId);

    if (status === 'active') {
      driverOrders = driverOrders.filter(order =>
        ['preparing', 'ready', 'picked_up', 'on_way'].includes(order.status)
      );
    } else if (status === 'history') {
      driverOrders = driverOrders.filter(order =>
        ['delivered', 'cancelled'].includes(order.status)
      );
    } else if (status && typeof status === 'string') {
      driverOrders = driverOrders.filter(order => order.status === status);
    }

    driverOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json(driverOrders);
  } catch (error) {
    console.error("خطأ في جلب طلبات السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// قبول طلب
router.post("/orders/:id/accept", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const driverId = req.driverId!;

    const driver = await storage.getDriver(driverId);
    if (!driver) return res.status(404).json({ error: "السائق غير موجود" });

    const order = await storage.getOrder(id);
    if (!order) return res.status(404).json({ error: "الطلب غير موجود" });

    if (!["confirmed", "assigned"].includes(order.status) || (order.driverId && order.driverId !== driverId)) {
      return res.status(400).json({ error: "لا يمكن قبول هذا الطلب" });
    }

    const commissionRate = parseFloat(driver.commissionRate?.toString() || "70");
    const orderAmount = parseFloat(order.totalAmount) || 0;
    const commissionAmount = (orderAmount * commissionRate) / 100;

    const updatedOrder = await storage.updateOrder(id, {
      driverId,
      status: "ready",
      driverCommissionRate: commissionRate,
      driverCommissionAmount: commissionAmount.toString(),
      commissionProcessed: false
    });

    const ws = req.app.get('ws');
    if (ws) ws.broadcast('order_update', { orderId: id, status: 'ready', driverId });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("خطأ في قبول الطلب:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تحديث حالة الطلب
router.put("/orders/:id/status", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;
    const driverId = req.driverId!;

    const order = await storage.getOrder(id);
    if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
    if (order.driverId !== driverId) return res.status(403).json({ error: "غير مصرح لك" });

    const allowedStatuses = ["preparing", "ready", "picked_up", "on_way", "delivered"];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: "حالة غير صحيحة" });

    if (location) {
      await storage.updateDriver(driverId, { currentLocation: location });
    }

    let updatedOrder;
    if (status === "delivered") {
      updatedOrder = await storage.completeOrder(id);
    } else {
      updatedOrder = await storage.updateOrder(id, { status });
    }

    const ws = req.app.get('ws');
    if (ws) ws.broadcast('order_update', { orderId: id, status, driverId });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("خطأ في تحديث حالة الطلب:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب تفاصيل طلب محدد
router.get("/orders/:id", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const driverId = req.driverId!;

    const order = await storage.getOrder(id);
    if (!order || order.driverId !== driverId) return res.status(404).json({ error: "الطلب غير موجود" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب إحصائيات السائق
router.get("/stats", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const driver = await storage.getDriver(driverId);
    if (!driver) return res.status(404).json({ error: "السائق غير موجود" });

    const driverBalance = await storage.getDriverBalance(driverId);
    const driverCommissions = await storage.getDriverCommissions(driverId);

    const advStorage = new AdvancedDatabaseStorage(storage.db);
    const driverReviews = await advStorage.getDriverReviews(driverId);

    const allOrders = await storage.getOrders();
    const driverOrders = allOrders.filter(order => order.driverId === driverId);
    const deliveredOrders = driverOrders.filter(order => order.status === "delivered");

    const totalEarnings = driverCommissions.reduce((sum, c) => sum + (parseFloat(c.commissionAmount.toString()) || 0), 0);

    res.json({
      totalOrders: driverOrders.length,
      completedOrders: deliveredOrders.length,
      totalEarnings,
      availableBalance: driverBalance?.availableBalance || 0,
      withdrawnAmount: driverBalance?.withdrawnAmount || 0,
      averageRating: driver.averageRating || 4.5,
      successRate: driverOrders.length > 0 ? Math.round((deliveredOrders.length / driverOrders.length) * 100) : 0,
      reviews: driverReviews || [],
    });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب بيانات الرصيد والمحفظة
router.get("/balance", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const balance = await storage.getDriverBalance(driverId);
    const transactions = await storage.getDriverTransactions(driverId);
    const withdrawals = await storage.getWithdrawalRequests(driverId, 'driver');

    res.json({
      balance: balance || { availableBalance: "0", totalBalance: "0", withdrawnAmount: "0", pendingAmount: "0" },
      transactions,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تحديث حالة السائق (متاح / غير متاح)
router.post("/status", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const { status } = req.body;

    if (!['available', 'offline'].includes(status)) {
      return res.status(400).json({ error: "حالة غير صحيحة" });
    }

    const isAvailable = status === 'available';
    await storage.updateDriver(driverId, { isAvailable });

    const ws = req.app.get('ws');
    if (ws) {
      ws.broadcast('driver_status_update', {
        driverId,
        isAvailable,
        status,
        timestamp: new Date()
      });

      if (typeof ws.sendToAdmin === 'function') {
        ws.sendToAdmin('driver_status_update', { driverId, isAvailable, status });
      }
    }

    const advStorage = new AdvancedDatabaseStorage(storage.db);

    if (isAvailable) {
      await advStorage.createWorkSession({
        driverId,
        startTime: new Date(),
        isActive: true,
        totalDeliveries: 0,
        totalEarnings: "0"
      });
    } else {
      const activeSession = await advStorage.getActiveWorkSession(driverId);
      if (activeSession) {
        await advStorage.endWorkSession(activeSession.id, 0, 0);
      }
    }

    res.json({ success: true, status });
  } catch (error) {
    console.error("خطأ في تحديث حالة السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تحديث موقع السائق (إحداثيات)
router.post("/location", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const { latitude, longitude, address } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "الإحداثيات مطلوبة" });
    }

    await storage.updateDriver(driverId, {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      currentLocation: address || undefined
    });

    const ws = req.app.get('ws');
    if (ws) {
      ws.broadcast('driver_location_update', {
        driverId,
        latitude,
        longitude,
        timestamp: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("خطأ في تحديث موقع السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// طلب سحب رصيد
router.post("/withdraw", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const { amount, method, details } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: "مبلغ غير صحيح" });

    const balance = await storage.getDriverBalance(driverId);
    const available = parseFloat(balance?.availableBalance?.toString() || "0");

    if (amount > available) return res.status(400).json({ error: "الرصيد غير كافٍ" });

    const withdrawal = await storage.createWithdrawalRequest({
      entityType: 'driver',
      entityId: driverId,
      amount: amount.toString(),
      status: 'pending',
      bankDetails: details || '',
      adminNotes: `وسيلة السحب: ${method || 'كاش'}`
    });

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب الملف الشخصي
router.get("/profile", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const driver = await storage.getDriver(driverId);
    if (!driver) return res.status(404).json({ error: "السائق غير موجود" });
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تحديث الملف الشخصي
router.put("/profile", requireDriverAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const driverId = req.driverId!;
    const coercedData = coerceRequestData(req.body);
    const validatedData = insertDriverSchema.partial().parse(coercedData);

    const driver = await storage.updateDriver(driverId, validatedData);
    if (!driver) return res.status(404).json({ error: "السائق غير موجود" });

    const ws = req.app.get('ws');
    if (ws && validatedData.isAvailable !== undefined) {
      ws.broadcast('driver_status_update', {
        driverId,
        isAvailable: driver.isAvailable,
        name: driver.name,
        timestamp: new Date()
      });

      if (typeof ws.sendToAdmin === 'function') {
        ws.sendToAdmin('driver_status_update', {
          driverId,
          isAvailable: driver.isAvailable,
          name: driver.name
        });
      }
    }

    res.json({ success: true, driver });
  } catch (error) {
    console.error("خطأ في تحديث الملف الشخصي:", error);
    res.status(400).json({ error: "بيانات غير صحيحة" });
  }
});

// ================================================================
// مسارات الـ Wildcard للإدارة (يجب أن تكون في النهاية دائماً)
// ================================================================

// جلب سائق محدد بالمعرف
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await storage.getDriver(id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch driver" });
  }
});

// تحديث بيانات سائق (من لوحة التحكم)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertDriverSchema.partial().parse(req.body);
    const driver = await storage.updateDriver(id, validatedData);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.json(driver);
  } catch (error) {
    res.status(400).json({ message: "Invalid driver data" });
  }
});

// حذف سائق
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await storage.deleteDriver(id);
    if (!success) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete driver" });
  }
});

export default router;
