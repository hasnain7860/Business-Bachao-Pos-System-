import { useState, useEffect } from "react";
import { addItem, getItems, deleteAndTrackItem, putItem, STORE_NAMES } from "../Utils/IndexedDb.jsx";
import { updateItem, deleteItem } from "./UpdateDeleteUntils.jsx";

const useNotificationContext = () => {
  const [notifications, setNotifications] = useState([]);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      const storedNotifications = await getItems(STORE_NAMES.notifications);
      const storedDeletedIds = await getItems(STORE_NAMES.notificationsDb); // Load deleted IDs

      setNotifications(storedNotifications);
      setDeletedNotificationIds(storedDeletedIds.map(item => item.id)); // Extract IDs
    };
    loadNotifications();
  }, []);

  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.notifications);
    setNotifications(updatedData);
  };

  // Add a new notification (Avoid duplicate & deleted notifications)
  const addNotification = async (newNotification) => {
    const existingNotifications = await getItems(STORE_NAMES.notifications);

    // Check if notification was deleted before
    if (deletedNotificationIds.includes(newNotification.id)) {
      return; // Ignore if deleted before
    }

    // Check if notification already exists
    const isDuplicate = existingNotifications.some(n => n.id === newNotification.id);

    if (!isDuplicate) {
      await addItem(STORE_NAMES.notifications, newNotification);
      setNotifications((prev) => [...prev, newNotification]);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === id ? { ...notif, isRead: true } : notif
    );
    setNotifications(updatedNotifications);
    await putItem(STORE_NAMES.notifications, { id, isRead: true }); // Update in DB
  };

  // Delete a notification and store its ID to prevent future duplicates
  const deleteNotification = async (id) => {
    await deleteAndTrackItem(STORE_NAMES.notifications, id);
    setNotifications((prev) => deleteItem(prev, id));

    // Store deleted ID to prevent re-adding
    await addItem(STORE_NAMES.notificationsDb, { id });
    setDeletedNotificationIds((prev) => [...prev, id]);
  };

  const notificationContext = {
    notifications,
    add: addNotification,
    markAsRead,
    delete: deleteNotification,
    refreshData,
  };

  return notificationContext;
};

export default useNotificationContext;
