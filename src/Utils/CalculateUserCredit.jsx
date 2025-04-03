export const CalculateUserCredit = (context, customerId) => {
    try {
        const salesData = context.SaleContext.Sales;
        const submittedRecords = context.creditManagementContext.submittedRecords;

        // Filter sales for specific customer
        const customerSales = salesData.filter(sale => sale.customerId === customerId);
console.log(customerSales + 'customer sales')
        // Calculate total sales amount for customer
        const totalSaleAmount = customerSales.reduce((total, sale) => {
            return total + (parseFloat(sale.totalBill) || 0);
        }, 0);

        // Calculate total payments made by customer
        const totalPayments = customerSales.reduce((total, sale) => {
            const basePayment = parseFloat(sale.amountPaid) || 0;
            const additionalPayments = sale.addPayment 
                ? sale.addPayment.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0)
                : 0;
            return total + basePayment + additionalPayments;
        }, 0);

        // Calculate submitted records (payments/credits)
        const customerSubmittedRecords = submittedRecords.filter(record => record.customerId === customerId);
        const submittedPayments = customerSubmittedRecords
            .filter(record => record.type === 'payment')
            .reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);

        // Calculate final credit
        const pendingCredit = totalSaleAmount - (totalPayments + submittedPayments);

        return {
            customerSales,
            customerId: customerId,
            totalSales: totalSaleAmount,
            totalPayments: totalPayments + submittedPayments,
            pendingCredit: Math.max(pendingCredit, 0),
            isOverLimit: pendingCredit > 0,
            creditStatus: pendingCredit > 0 ? 'PENDING' : 'CLEAR'
        };

    } catch (error) {
        console.error('Error calculating credit:', error);
        return {
       
            customerId: customerId,
            totalSales: 0,
            totalPayments: 0,
            pendingCredit: 0,
            isOverLimit: false,
            creditStatus: 'ERROR',
            error: error.message
        };
    }
};