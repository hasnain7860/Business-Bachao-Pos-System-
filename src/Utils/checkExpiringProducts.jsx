import { v4 as uuidv4 } from "uuid";

const checkExpiringProducts = async (context) => {
  const { notifications, add: addNotification, refreshData } = context.notificationContext;
  const products = context.productContext.products;

  await refreshData(); // Ensure notifications are up-to-date

  // Get today's date in UTC (YYYY-MM-DD format)
  const today = new Date().toISOString().split('T')[0];

  products.forEach((product) => {
    product.batchCode.forEach((batch) => {
      // Convert expiration date to UTC format (YYYY-MM-DD)
      const expDate = new Date(batch.expirationDate).toISOString().split('T')[0];

      // Calculate daysLeft using simple date difference
      const timeDiff = (new Date(expDate) - new Date(today)) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.ceil(timeDiff);

      console.log(`Batch: ${batch.batchCode} - Days Left: ${daysLeft}`);

      let message = "";
      let type = "";

      if (daysLeft === 30) {
        message = `⚠️ Batch ${batch.batchCode} of ${product.name} will expire in 1 month!`;
        type = "warning";
      } else if (daysLeft === 7) {
        message = `⏳ Batch ${batch.batchCode} of ${product.name} will expire in 7 days!`;
        type = "error";
      } else if (daysLeft === 1) {
        message = `🔥 Batch ${batch.batchCode} of ${product.name} expires tomorrow!`;
        type = "danger";
      } else if (daysLeft < 0) {
        message = `❌ Batch ${batch.batchCode} of ${product.name} has expired!`;
        type = "expired";
      }

      if (message) {
        // Prevent duplicate notifications
        const alreadyExists = notifications.some((notif) => notif.message === message);

        if (!alreadyExists) {
          const newNotification = {
            id: uuidv4(),
            message,
            type,
            timestamp: new Date().toISOString(),
          };

          addNotification(newNotification);
        }
      }
    });
  });
};

export default checkExpiringProducts;
