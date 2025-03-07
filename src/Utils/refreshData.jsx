
 const refreshData = async (context) => {
      await context.companyContext.refreshData();
      await context.brandContext.refreshData();
      await context.unitContext.refreshData();
      await context.productContext.refreshData();
      await context.supplierCustomerContext.refreshData();
      await context.settingContext.refreshData();
      await context.creditManagementContext.refreshData();
      await context.purchaseContext.refreshData();
      await context.SaleContext.refreshData();
      console.log("✅ All contexts refreshed successfully!");
    };


export default refreshData