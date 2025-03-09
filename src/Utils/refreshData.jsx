

const refreshData = async (context) => {
  context.companyContext.refreshData(),
  context.brandContext.refreshData(),
  context.unitContext.refreshData(),
  context.productContext.refreshData(),
  context.supplierCustomerContext.refreshData(),
  context.settingContext.refreshData(),
  // context.creditManagementContext.refreshData(),
  // context.purchaseContext.refreshData(),
  // context.salesContext.refreshData(),
  // context.costContext.refreshData(),
  // context.notificationContext.refreshData(),
      console.log("✅ All contexts refreshed successfully!");
    };


export default refreshData