export const CalculateUserCredit = (context, personId) => {
    try {
        const salesData = context.SaleContext.Sales;
        const submittedRecords = context.creditManagementContext.submittedRecords;
        const sellReturnsData = context.SellReturnContext.sellReturns;
        const purchasesData = context.purchaseContext.purchases;

        // Filter sales and purchases for specific person
        const personSales = salesData.filter(sale => sale.personId === personId);
        const personPurchases = purchasesData.filter(purchase => purchase.personId === personId);

        // Total sale amount (humne customer ko diya)
        const totalSaleAmount = personSales.reduce((total, sale) => {
            return total + (parseFloat(sale.totalBill) || 0);
        }, 0);

        // Total payments received from sales
        const totalPayments = personSales.reduce((total, sale) => {
            return total + (parseFloat(sale.amountPaid) || 0);
        }, 0);

        // Submitted payments and credits
        const personSubmittedRecords = submittedRecords.filter(record => record.personId === personId);
        const submittedPayments = personSubmittedRecords
            .filter(record => record.type === 'payment')
            .reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);

        const submittedCredits = personSubmittedRecords
            .filter(record => record.type === 'credit')
            .reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);

        // Sell return adjustments
        const personReturns = sellReturnsData.filter(ret => ret.people === personId);
        const totalCreditAdjustments = personReturns.reduce((total, ret) => {
            return total + (parseFloat(ret.paymentDetails?.creditAdjustment) || 0);
        }, 0);

        // Purchase Data: (humne kisi se khareeda)
        const totalPurchaseAmount = personPurchases.reduce((total, pur) => {
            return total + (parseFloat(pur.totalBill) || 0);
        }, 0);

        const totalPurchasePayments = personPurchases.reduce((total, pur) => {
            return total + (parseFloat(pur.totalPayment) || 0);
        }, 0);

        // Final credit calculation
        const creditReceivable = submittedCredits + totalSaleAmount; // humne diya
        const creditPayable = totalPayments + submittedPayments + totalCreditAdjustments; // hume mila

        const purchasePayable = totalPurchaseAmount; // humne khareeda
        const purchasePaid = totalPurchasePayments; // humne diya

        const netPendingCredit = (creditReceivable - creditPayable) - (purchasePayable - purchasePaid);

        const hasExcessPayment = netPendingCredit < 0;
        const excessAmount = Math.abs(Math.min(netPendingCredit, 0));

        return {
            personId: personId,
            totalSales: totalSaleAmount,
            totalSalesReceived: totalPayments + submittedPayments + totalCreditAdjustments,
            totalPurchases: totalPurchaseAmount,
            totalPurchasesPaid: totalPurchasePayments,
            pendingCredit: netPendingCredit,
            excessPayment: excessAmount,
            hasExcessPayment: hasExcessPayment,
            isOverLimit: netPendingCredit > 0,
            creditStatus: netPendingCredit > 0 ? 'PENDING' :
                         hasExcessPayment ? 'EXCESS_PAYMENT' : 'CLEAR'
        };
    } catch (error) {
        console.error('Error calculating credit:', error);
        return {
            personId: personId,
            totalSales: 0,
            totalSalesReceived: 0,
            totalPurchases: 0,
            totalPurchasesPaid: 0,
            pendingCredit: 0,
            isOverLimit: false,
            creditStatus: 'ERROR',
            error: error.message
        };
    }
};