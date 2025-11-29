import { STORE_NAMES } from './IndexedDb.jsx';

// Updated mapping based on AppFullContext
const refreshData = async (context, storeName) => {
  if (!storeName) {
    // Refresh EVERYTHING logic
    console.log("♻️ Refreshing ALL contexts...");
    const promises = [
      context.peopleContext.refreshData(),
      context.productContext.refreshData(),
      context.unitContext.refreshData(),
      context.costContext.refreshData(),
      context.purchaseContext.refreshData(),
      context.SaleContext.refreshData(),
      context.areasContext.refreshData(),
      context.preordersContext.refreshData(),
      context.damageContext.refreshData(),
      context.purchaseReturnContext.refreshData(),
      context.SellReturnContext.refreshData(), // Case sensitive check karna AppFullContext se
      context.supplierCustomerContext.refreshData(),
      context.creditManagementContext.refreshData(),
      context.settingContext.refreshData(),
    ];
    await Promise.all(promises);
    return;
  }

  // Individual Store Refresh
  switch (storeName) {
    case STORE_NAMES.people:
      await context.peopleContext.refreshData();
      break;
    case STORE_NAMES.products:
      await context.productContext.refreshData();
      break;
    case STORE_NAMES.units:
      await context.unitContext.refreshData();
      break;
    case STORE_NAMES.cost:
      await context.costContext.refreshData();
      break;
    case STORE_NAMES.purchases:
      await context.purchaseContext.refreshData();
      break;
    case STORE_NAMES.sales:
      await context.SaleContext.refreshData();
      break;
    case STORE_NAMES.areas:
      await context.areasContext.refreshData();
      break;
    case STORE_NAMES.preorders:
      await context.preordersContext.refreshData();
      break;
    case STORE_NAMES.damage:
      await context.damageContext.refreshData();
      break;
    case STORE_NAMES.purchaseReturns:
      await context.purchaseReturnContext.refreshData();
      break;
    case STORE_NAMES.sellReturns:
      await context.SellReturnContext.refreshData();
      break;
    case STORE_NAMES.suppliers:
    case STORE_NAMES.customers:
      await context.supplierCustomerContext.refreshData();
      break;
    case STORE_NAMES.creditManagement:
      await context.creditManagementContext.refreshData();
      break;
    case STORE_NAMES.settings:
      await context.settingContext.refreshData();
      break;
    
    // Fallback for company/notifications if needed
    case STORE_NAMES.company:
      await context.companyContext.refreshData();
      break;

    default:
      console.warn(`⚠️ No refresh handler found for store: ${storeName}`);
      break;
  }
};

export default refreshData;

