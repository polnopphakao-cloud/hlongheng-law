const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
initializeApp();
const db = getFirestore();
const PLAN_CONFIG = Object.freeze({
  monthly_99: {
    label: "รายเดือน",
    amount: 99,
    durationDays: 30,
    questionLimit: 20,
    dailyQuestionLimit: 1,
  },

  monthly: {
    label: "รายเดือน",
    amount: 99,
    durationDays: 30,
    questionLimit: 20,
    dailyQuestionLimit: 1,
  },

  monthly_199: {
    label: "รายเดือนพิเศษ",
    amount: 199,
    durationDays: 30,
    questionLimit: 45,
    dailyQuestionLimit: 2,
  },

  yearly: {
    label: "รายปี",
    amount: 999,
    durationDays: 365,
    questionLimit: 230,
    dailyQuestionLimit: 5,
  },

  vip: {
    label: "VIP",
    amount: 1999,
    durationDays: 1095,
    questionLimit: 700,
    dailyQuestionLimit: 8,
  },
});



const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

exports.createCheckoutSession = onRequest(
  { secrets: [stripeSecretKey], cors: true },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({error: "Method not allowed"});
      }

      const authorization = String(req.headers.authorization || "");
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return res.status(401).json({error: "กรุณาเข้าสู่ระบบก่อนชำระเงิน"});
      }

      let decodedToken;
      try {
        decodedToken = await getAuth().verifyIdToken(match[1], true);
      } catch (error) {
        console.error("Invalid Firebase ID token", error.message);
        return res.status(401).json({error: "เซสชันเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ"});
      }

      if (decodedToken.email_verified !== true) {
        return res.status(403).json({error: "กรุณายืนยันอีเมลก่อนชำระเงิน"});
      }

      const paymentId = String(req.body?.paymentId || "").trim();
      const requestedReturnUrl = String(req.body?.returnUrl || "").trim();

      const allowedReturnUrls = new Set([
        "https://hlongheng.com",
        "https://www.hlongheng.com",
        "https://hlongheng-law.web.app",
      ]);

      const returnUrl = allowedReturnUrls.has(requestedReturnUrl)
        ? requestedReturnUrl
        : "https://hlongheng-law.web.app";

      if (!paymentId) {
        return res.status(400).json({
          error: "ไม่พบรหัสรายการชำระเงิน",
        });
      }

      const paymentRef = db.collection("payments").doc(paymentId);
      const paymentSnapshot = await paymentRef.get();

      if (!paymentSnapshot.exists) {
        return res.status(404).json({
          error: "ไม่พบรายการชำระเงิน",
        });
      }

      const payment = paymentSnapshot.data();

      if (payment.status !== "pending") {
        return res.status(409).json({
          error: "รายการชำระเงินนี้ไม่อยู่ในสถานะรอชำระ",
        });
      }

      if (!payment.userId) {
        return res.status(400).json({
          error: "รายการชำระเงินไม่มีข้อมูลสมาชิก",
        });
      }

      if (payment.userId !== decodedToken.uid) {
        return res.status(403).json({
          error: "ไม่มีสิทธิสร้างหน้าชำระเงินสำหรับรายการนี้",
        });
      }

      const planCode = String(payment.plan || "");
      const planConfig = PLAN_CONFIG[planCode];

      if (!planConfig) {
        return res.status(400).json({
          error: "แพ็กเกจสมาชิกไม่ถูกต้อง",
        });
      }

      const Stripe = require("stripe");
      const stripe = new Stripe(stripeSecretKey.value());


      // กดซ้ำให้ใช้ Checkout Session เดิม ถ้ายังเปิดอยู่
      if (payment.stripeCheckoutSessionId) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(
            payment.stripeCheckoutSessionId,
          );
          if (existingSession.status === "open" && existingSession.url) {
            return res.status(200).json({
              url: existingSession.url,
              sessionId: existingSession.id,
              reused: true,
            });
          }
        } catch (error) {
          console.warn("Unable to reuse Checkout Session", error.message);
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",

        payment_intent_data: {
          metadata: {
            paymentId,
          },
        },

        allowed_payment_method_types: ["promptpay"],

        line_items: [
          {
            price_data: {
              currency: "thb",

              product_data: {
                name: `สมาชิก${planConfig.label}`,
                description:
                  `${planConfig.questionLimit} คำถาม ` +
                  `ใช้ได้ ${planConfig.durationDays} วัน`,
              },

              unit_amount: planConfig.amount * 100,
            },

            quantity: 1,
          },
        ],

        success_url: `${returnUrl}/?payment=success`,
        cancel_url: `${returnUrl}/?payment=cancelled`,
      }, {
        idempotencyKey: `checkout-${paymentId}`,
      });

      await paymentRef.update({
        amount: planConfig.amount,
        planLabel: planConfig.label,
        questionLimit: planConfig.questionLimit,
        dailyQuestionLimit: planConfig.dailyQuestionLimit,
        durationDays: planConfig.durationDays,
        stripeCheckoutSessionId: session.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await db.collection("paymentAuditLogs").add({
        action: "checkout_created",
        paymentId,
        userId: decodedToken.uid,
        plan: planCode,
        amount: planConfig.amount,
        currency: "thb",
        stripeCheckoutSessionId: session.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        url: session.url,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "ไม่สามารถสร้างหน้าชำระเงินได้",
      });
    }
  },
);

exports.stripeWebhook = onRequest(
  {secrets: [stripeSecretKey, stripeWebhookSecret]},
  async (req, res) => {
    const Stripe = require("stripe");
    const stripe = new Stripe(stripeSecretKey.value());
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value(),
      );
    } catch (error) {
      console.error("Webhook signature error:", error.message);
      return res.status(400).send("Invalid webhook signature");
    }

    const eventRef = db.collection("stripeEvents").doc(event.id);

    try {
      // Stripe อาจส่ง event เดิมซ้ำ ระบบต้องทำงานเพียงครั้งเดียว
      const previousEvent = await eventRef.get();
      if (previousEvent.exists) {
        return res.status(200).send("Duplicate event ignored");
      }

      if (
        event.type === "payment_intent.succeeded" ||
        event.type === "payment_intent.payment_failed"
      ) {
        const paymentIntent = event.data.object;
        const paymentId = String(paymentIntent.metadata?.paymentId || "").trim();

        if (!paymentId) {
          console.error("Webhook ไม่มี paymentId", event.id);
          await eventRef.set({
            type: event.type,
            status: "rejected_missing_payment_id",
            createdAt: FieldValue.serverTimestamp(),
          });
          return res.status(200).send("Missing paymentId recorded");
        }

        const paymentRef = db.collection("payments").doc(paymentId);

        if (event.type === "payment_intent.succeeded") {
          await db.runTransaction(async (transaction) => {
            const [eventSnapshot, paymentSnapshot] = await Promise.all([
              transaction.get(eventRef),
              transaction.get(paymentRef),
            ]);

            if (eventSnapshot.exists) return;
            if (!paymentSnapshot.exists) {
              transaction.set(eventRef, {
                type: event.type,
                paymentId,
                status: "rejected_payment_not_found",
                createdAt: FieldValue.serverTimestamp(),
              });
              return;
            }

            const payment = paymentSnapshot.data();
            const planCode = String(payment.plan || "");
            const planConfig = PLAN_CONFIG[planCode];

            if (!planConfig || !payment.userId) {
              transaction.set(eventRef, {
                type: event.type,
                paymentId,
                status: "rejected_invalid_payment_data",
                createdAt: FieldValue.serverTimestamp(),
              });
              return;
            }

            // Stripe ใช้หน่วยสตางค์: 99 บาท = 9,900
            const expectedAmount = planConfig.amount * 100;
            const actualAmount = Number(paymentIntent.amount_received || 0);
            const actualCurrency = String(paymentIntent.currency || "").toLowerCase();

            if (actualAmount !== expectedAmount || actualCurrency !== "thb") {
              transaction.update(paymentRef, {
                status: "review_required",
                webhookAmount: actualAmount,
                webhookCurrency: actualCurrency,
                updatedAt: FieldValue.serverTimestamp(),
              });
              transaction.set(eventRef, {
                type: event.type,
                paymentId,
                userId: payment.userId,
                status: "rejected_amount_or_currency_mismatch",
                expectedAmount,
                actualAmount,
                actualCurrency,
                createdAt: FieldValue.serverTimestamp(),
              });
              return;
            }

            // รายการที่เปิดสิทธิแล้วต้องไม่เปิดซ้ำ
            if (payment.status === "paid") {
              transaction.set(eventRef, {
                type: event.type,
                paymentId,
                userId: payment.userId,
                status: "duplicate_payment_ignored",
                createdAt: FieldValue.serverTimestamp(),
              });
              return;
            }

            const userRef = db.collection("users").doc(payment.userId);
            const userSnapshot = await transaction.get(userRef);
            if (!userSnapshot.exists) {
              transaction.set(eventRef, {
                type: event.type,
                paymentId,
                userId: payment.userId,
                status: "rejected_user_not_found",
                createdAt: FieldValue.serverTimestamp(),
              });
              return;
            }

            const startedAt = new Date();
            const expiresAt = new Date(
              startedAt.getTime() + planConfig.durationDays * 24 * 60 * 60 * 1000,
            );

            transaction.update(userRef, {
              plan: planCode,
              planLabel: planConfig.label,
              questionLimit: planConfig.questionLimit,
              dailyQuestionLimit: planConfig.dailyQuestionLimit,
              questionUsed: 0,
              dailyQuestionUsed: 0,
              dailyQuestionDate: null,
              status: "active",
              planStartedAt: startedAt,
              planExpiresAt: expiresAt,
              updatedAt: FieldValue.serverTimestamp(),
            });

            transaction.update(paymentRef, {
              status: "paid",
              amount: planConfig.amount,
              currency: "thb",
              planLabel: planConfig.label,
              questionLimit: planConfig.questionLimit,
              dailyQuestionLimit: planConfig.dailyQuestionLimit,
              durationDays: planConfig.durationDays,
              paidAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              stripeEventId: event.id,
              stripePaymentIntentId: paymentIntent.id,
            });

            transaction.set(eventRef, {
              type: event.type,
              paymentId,
              userId: payment.userId,
              paymentIntentId: paymentIntent.id,
              plan: planCode,
              amount: planConfig.amount,
              currency: "thb",
              status: "membership_activated",
              createdAt: FieldValue.serverTimestamp(),
            });

            transaction.set(db.collection("paymentAuditLogs").doc(), {
              action: "payment_succeeded_membership_activated",
              stripeEventId: event.id,
              paymentId,
              userId: payment.userId,
              paymentIntentId: paymentIntent.id,
              plan: planCode,
              amount: planConfig.amount,
              currency: "thb",
              createdAt: FieldValue.serverTimestamp(),
            });
          });
        } else {
          await db.runTransaction(async (transaction) => {
            const [eventSnapshot, paymentSnapshot] = await Promise.all([
              transaction.get(eventRef),
              transaction.get(paymentRef),
            ]);
            if (eventSnapshot.exists) return;

            if (paymentSnapshot.exists && paymentSnapshot.data().status !== "paid") {
              transaction.update(paymentRef, {
                status: "failed",
                failedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                stripeEventId: event.id,
                stripePaymentIntentId: paymentIntent.id,
              });
            }

            transaction.set(eventRef, {
              type: event.type,
              paymentId,
              paymentIntentId: paymentIntent.id,
              status: "payment_failed_recorded",
              createdAt: FieldValue.serverTimestamp(),
            });

            transaction.set(db.collection("paymentAuditLogs").doc(), {
              action: "payment_failed",
              stripeEventId: event.id,
              paymentId,
              paymentIntentId: paymentIntent.id,
              createdAt: FieldValue.serverTimestamp(),
            });
          });
        }
      } else if (event.type === "charge.refunded") {
        const charge = event.data.object;
        let paymentId = String(charge.metadata?.paymentId || "").trim();
        let paymentIntentId = String(charge.payment_intent || "").trim();

        // metadata ปกติอยู่บน PaymentIntent จึงดึงมาตรวจซ้ำ
        if (!paymentId && paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          paymentId = String(paymentIntent.metadata?.paymentId || "").trim();
        }

        if (paymentId) {
          const paymentRef = db.collection("payments").doc(paymentId);
          await db.runTransaction(async (transaction) => {
            const [eventSnapshot, paymentSnapshot] = await Promise.all([
              transaction.get(eventRef),
              transaction.get(paymentRef),
            ]);
            if (eventSnapshot.exists) return;

            if (paymentSnapshot.exists) {
              const payment = paymentSnapshot.data();
              transaction.update(paymentRef, {
                status: "refunded",
                refundedAt: FieldValue.serverTimestamp(),
                refundAmount: Number(charge.amount_refunded || 0),
                updatedAt: FieldValue.serverTimestamp(),
                stripeRefundEventId: event.id,
              });
              transaction.set(db.collection("paymentAuditLogs").doc(), {
                action: "payment_refunded",
                stripeEventId: event.id,
                paymentId,
                userId: payment.userId || null,
                paymentIntentId,
                refundAmount: Number(charge.amount_refunded || 0),
                createdAt: FieldValue.serverTimestamp(),
              });
            }

            transaction.set(eventRef, {
              type: event.type,
              paymentId,
              paymentIntentId,
              status: "refund_recorded",
              createdAt: FieldValue.serverTimestamp(),
            });
          });
        } else {
          await eventRef.set({
            type: event.type,
            status: "refund_missing_payment_id",
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      } else {
        await eventRef.set({
          type: event.type,
          status: "ignored_event_type",
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return res.status(200).send("Webhook received");
    } catch (error) {
      console.error("Webhook processing error:", event.id, error);
      // ส่ง 500 เพื่อให้ Stripe retry เมื่อเกิดข้อผิดพลาดชั่วคราว
      return res.status(500).send("Webhook processing failed");
    }
  },
);

// ==================================================
// ส่งคำถามอย่างปลอดภัยผ่าน Callable Function
// ==================================================
exports.submitQuestionSecure = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "กรุณาเข้าสู่ระบบก่อนส่งคำถาม",
      );
    }

    const userId = request.auth.uid;
    const subject = String(request.data?.subject || "").trim();
    const detail = String(request.data?.detail || "").trim();

    if (subject.length < 3 || subject.length > 200) {
      throw new HttpsError(
        "invalid-argument",
        "หัวข้อคำถามต้องมี 3-200 ตัวอักษร",
      );
    }

    if (detail.length < 10 || detail.length > 5000) {
      throw new HttpsError(
        "invalid-argument",
        "รายละเอียดคำถามต้องมี 10-5,000 ตัวอักษร",
      );
    }

    const userRef = db.collection("users").doc(userId);
    const questionRef = db.collection("questions").doc();

    try {
      const result = await db.runTransaction(
        async (transaction) => {
          const userSnapshot = await transaction.get(userRef);

          if (!userSnapshot.exists) {
            throw new HttpsError(
              "not-found",
              "ไม่พบข้อมูลสมาชิก",
            );
          }

          const member = userSnapshot.data();
          const planCode = String(member.plan || "free");
          const currentUsed = Number(member.questionUsed || 0);
          const currentLimit = Number(member.questionLimit || 0);
          const dailyLimit = Number(
            member.dailyQuestionLimit || 0,
          );

          if (member.status !== "active") {
            throw new HttpsError(
              "failed-precondition",
              "บัญชียังไม่พร้อมใช้งาน",
            );
          }

          if (
            !Number.isFinite(currentLimit) ||
            currentLimit <= 0 ||
            currentUsed >= currentLimit
          ) {
            throw new HttpsError(
              "resource-exhausted",
              "สิทธิคำถามหมดหรือยังไม่ได้รับสิทธิ",
            );
          }

          if (planCode !== "free" && member.planExpiresAt) {
            const expiresAt =
              typeof member.planExpiresAt.toDate === "function"
                ? member.planExpiresAt.toDate()
                : new Date(member.planExpiresAt);

            if (
              Number.isFinite(expiresAt.getTime()) &&
              expiresAt.getTime() <= Date.now()
            ) {
              throw new HttpsError(
                "failed-precondition",
                "แพ็กเกจสมาชิกหมดอายุแล้ว",
              );
            }
          }

          // แปลงเวลาปัจจุบันเป็นวันที่ประเทศไทย
          const thailandNow = new Date(
            Date.now() + 7 * 60 * 60 * 1000,
          );

          const todayInThailand = thailandNow
            .toISOString()
            .slice(0, 10);

          const isSameDay =
            String(member.dailyQuestionDate || "") ===
            todayInThailand;

          const currentDailyUsed = isSameDay
            ? Number(member.dailyQuestionUsed || 0)
            : 0;

          if (
            dailyLimit > 0 &&
            currentDailyUsed >= dailyLimit
          ) {
            throw new HttpsError(
              "resource-exhausted",
              `วันนี้ใช้สิทธิครบ ${dailyLimit} คำถามแล้ว`,
            );
          }

          transaction.create(questionRef, {
            userId,
            userName:
              member.name ||
              member.displayName ||
              request.auth.token.name ||
              "",
            userEmail:
              member.email ||
              request.auth.token.email ||
              "",
            subject,
            detail,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          transaction.update(userRef, {
            questionUsed: currentUsed + 1,
            dailyQuestionUsed: currentDailyUsed + 1,
            dailyQuestionDate: todayInThailand,
            updatedAt: FieldValue.serverTimestamp(),
          });

          return {
            questionId: questionRef.id,
            questionUsed: currentUsed + 1,
            questionLimit: currentLimit,
            dailyQuestionUsed: currentDailyUsed + 1,
            dailyQuestionLimit: dailyLimit,
          };
        },
      );

      return {
        ok: true,
        message: "ส่งคำถามเรียบร้อยแล้ว",
        ...result,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error("submitQuestionSecure error:", error);

      throw new HttpsError(
        "internal",
        "ไม่สามารถส่งคำถามได้ กรุณาลองใหม่",
      );
    }
  },
);

// ==================================================
// แจ้งเตือนแอดมินเมื่อมีสมาชิกใหม่
// ==================================================
exports.notifyAdminNewMember = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      console.log("ไม่พบข้อมูลสมาชิกใหม่");
      return;
    }

    const userId = event.params.userId;
    const member = snapshot.data() || {};

    // แจ้งเตือนเฉพาะบัญชีสมาชิกทั่วไป
    if (member.role && member.role !== "member") {
      return;
    }

    const notificationRef = db
      .collection("adminNotifications")
      .doc(userId);

    await notificationRef.set(
      {
        type: "new_member",
        title: "มีสมาชิกใหม่สมัครใช้งาน",
        message:
          `${member.name || "ไม่ระบุชื่อ"} ` +
          `สมัครสมาชิกใหม่`,
        userId,
        userName: member.name || "",
        userEmail: member.email || "",
        plan: member.plan || "free",
        questionLimit: Number(
          member.questionLimit || 5,
        ),
        isRead: false,
        memberCreatedAt:
          member.createdAt ||
          FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: false,
      },
    );

    console.log(
      `สร้างการแจ้งเตือนสมาชิกใหม่แล้ว: ${userId}`,
    );
  },
);

// Secure admin member management
const ADMIN_MEMBER_PLANS = Object.freeze({
  free: {label: "ฟรี", amount: 0, durationDays: 0, questionLimit: 5, dailyQuestionLimit: 0},
  monthly_99: {label: "รายเดือน", amount: 99, durationDays: 30, questionLimit: 20, dailyQuestionLimit: 1},
  monthly_199: {label: "รายเดือนพิเศษ", amount: 199, durationDays: 30, questionLimit: 45, dailyQuestionLimit: 2},
  yearly: {label: "รายปี", amount: 999, durationDays: 365, questionLimit: 230, dailyQuestionLimit: 5},
  vip: {label: "VIP", amount: 1999, durationDays: 1095, questionLimit: 700, dailyQuestionLimit: 8},
});

exports.adminUpdateMember = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "กรุณาเข้าสู่ระบบ");
  const actorSnapshot = await db.collection("users").doc(request.auth.uid).get();
  const adminSnapshot = await db.collection("admins").doc(request.auth.uid).get();
  const isRoleAdmin = actorSnapshot.exists && actorSnapshot.data().role === "admin";
  const isLegacyAdmin = adminSnapshot.exists && adminSnapshot.data().active === true;
  if (!isRoleAdmin && !isLegacyAdmin) throw new HttpsError("permission-denied", "เฉพาะแอดมินเท่านั้นที่จัดการสมาชิกได้");

  const userId = String(request.data?.userId || "").trim();
  const planCode = String(request.data?.plan || "").trim();
  const role = String(request.data?.role || "member").trim();
  const status = String(request.data?.status || "active").trim();
  const requestedUsed = Number(request.data?.questionUsed || 0);
  const resetUsage = Boolean(request.data?.resetUsage);
  if (!userId) throw new HttpsError("invalid-argument", "ไม่พบรหัสสมาชิก");
  if (!ADMIN_MEMBER_PLANS[planCode]) throw new HttpsError("invalid-argument", "แพ็กเกจไม่ถูกต้อง");
  if (!["member", "admin"].includes(role)) throw new HttpsError("invalid-argument", "บทบาทไม่ถูกต้อง");
  if (!["active", "suspended"].includes(status)) throw new HttpsError("invalid-argument", "สถานะไม่ถูกต้อง");
  if (!Number.isInteger(requestedUsed) || requestedUsed < 0) throw new HttpsError("invalid-argument", "จำนวนที่ใช้แล้วต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
  if (userId === request.auth.uid && role !== "admin") throw new HttpsError("failed-precondition", "ห้ามลดสิทธิแอดมินของบัญชีที่กำลังใช้งาน");
  const plan = ADMIN_MEMBER_PLANS[planCode];
  if (requestedUsed > plan.questionLimit) throw new HttpsError("invalid-argument", `จำนวนที่ใช้แล้วต้องไม่เกิน ${plan.questionLimit}`);

  const targetRef = db.collection("users").doc(userId);
  const auditRef = db.collection("adminAuditLogs").doc();
  await db.runTransaction(async (transaction) => {
    const targetSnapshot = await transaction.get(targetRef);
    if (!targetSnapshot.exists) throw new HttpsError("not-found", "ไม่พบสมาชิก");
    const before = targetSnapshot.data();
    const now = new Date();
    const expiresAt = plan.durationDays ? new Date(now.getTime() + plan.durationDays * 86400000) : null;
    const questionUsed = resetUsage ? 0 : requestedUsed;
    const values = {plan: planCode, planLabel: plan.label, role, status, questionLimit: plan.questionLimit, dailyQuestionLimit: plan.dailyQuestionLimit, questionUsed, planStartedAt: plan.durationDays ? now : null, planExpiresAt: expiresAt, updatedAt: FieldValue.serverTimestamp()};
    if (resetUsage) { values.dailyQuestionUsed = 0; values.dailyQuestionDate = null; }
    transaction.update(targetRef, values);
    transaction.create(auditRef, {type: "member_update", actorId: request.auth.uid, actorEmail: request.auth.token.email || "", targetUserId: userId, targetEmail: before.email || "", before: {plan: before.plan || "", role: before.role || "member", status: before.status || "", questionLimit: Number(before.questionLimit || 0), questionUsed: Number(before.questionUsed || 0)}, after: {plan: planCode, role, status, questionLimit: plan.questionLimit, questionUsed}, createdAt: FieldValue.serverTimestamp()});
  });
  return {ok: true, message: "บันทึกสิทธิสมาชิกเรียบร้อยแล้ว"};
});

