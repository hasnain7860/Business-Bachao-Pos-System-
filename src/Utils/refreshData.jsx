const refreshData = async (context, storeName) => {
  switch (storeName) {
    case "cost":
      await context.costContext.refreshData();
      console.log("✅ Cost context refreshed!");
      break;
    case "company":
      await context.companyContext.refreshData();
      console.log("✅ Company context refreshed!");
      break;
  
    case "products":
      await context.productContext.refreshData();
      console.log("✅ Products context refreshed!");
      break;
    case "purchases":
      await context.purchaseContext.refreshData();
      console.log("✅ Purchases context refreshed!");
      break;
    case "sales":
      await context.salesContext.refreshData();
      console.log("✅ Sales context refreshed!");
      break;
    case "units":
      await context.unitContext.refreshData();
      console.log("✅ Units context refreshed!");
      break;
    case "suppliers":
      await context.supplierCustomerContext.refreshData();
      console.log("✅ Suppliers context refreshed!");
      break;
    case "customers":
      await context.supplierCustomerContext.refreshData();
      console.log("✅ Customers context refreshed!");
      break;
    case "settings":
      await context.settingContext.refreshData();
      console.log("✅ Settings context refreshed!");
      break;
    case "creditManagement":
      await context.creditManagementContext.refreshData();
      console.log("✅ Credit Management context refreshed!");
      break;
    // case "notifications":
    //   await context.notificationContext.refreshData();
    //   console.log("✅ Notifications context refreshed!");
    //   break;
    // case "notificationsDb":
    //   await context.notificationsDbContext.refreshData();
    //   console.log("✅ Notifications DB context refreshed!");
    //   break;
    default:
      // Agar storeName undefined ya invalid ho, toh saare refresh ho jayein
      await Promise.all([
        context.costContext.refreshData(),
        context.companyContext.refreshData(),
        context.productContext.refreshData(),
        context.purchaseContext.refreshData(),
        context.salesContext.refreshData(),
        context.unitContext.refreshData(),
        context.supplierCustomerContext.refreshData(),
        context.settingContext.refreshData(),
        context.creditManagementContext.refreshData(),
        // context.notificationContext.refreshData(),
        // context.notificationsDbContext.refreshData(),
      ]);
      console.log("✅ All contexts refreshed successfully!");
      break;
  }
};

export default refreshData;