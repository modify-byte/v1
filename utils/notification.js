const Notification = require('../models/Notification');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  sourceId = "",
  offerId = "",
  offerEndAt,
  dedupeScope = ""
}) => {
  const normalizedTitle = String(title || "").trim();
  const normalizedMessage = String(message || "").trim();

  if (!userId || !normalizedTitle || !normalizedMessage) return null;

  let expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  if (offerEndAt) {
    const parsedEnd = new Date(offerEndAt);
    if (!Number.isNaN(parsedEnd.getTime())) expiresAt = parsedEnd;
  }

  const safeSourceId = sourceId ? String(sourceId) : "";
  const safeOfferId = offerId ? String(offerId) : "";
  const dedupeKey = dedupeScope ? `${userId}:${type}:${dedupeScope}` : "";

  try {
    return await Notification.create({
      userId,
      type,
      title: normalizedTitle,
      message: normalizedMessage,
      sourceId: safeSourceId,
      offerId: safeOfferId,
      offerEndAt: offerEndAt || null,
      expiresAt,
      dedupeKey
    });
  } catch (err) {
    // Ignore duplicate notifications (idempotent behavior).
    if (err && err.code === 11000) return null;
    throw err;
  }
};

module.exports = { createNotification };
