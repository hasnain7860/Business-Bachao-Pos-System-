export const CalculateUserCredit = (context, personId) => {
    try {
        const salesData = context.SaleContext.Sales;
        const submittedRecords = context.creditManagementContext.submittedRecords;

        // Filter sales for specific person
        const personSales = salesData.filter(sale => sale.personId === personId);

        // Calculate total sales amount for person
        const totalSaleAmount = personSales.reduce((total, sale) => {
            return total + (parseFloat(sale.totalBill) || 0);
        }, 0);

        // Calculate total payments made by person
        const totalPayments = personSales.reduce((total, sale) => {
            return total + (parseFloat(sale.amountPaid) || 0);
        }, 0);

        // Calculate submitted records (payments/credits)
        const personSubmittedRecords = submittedRecords.filter(record => record.personId === personId);
        const submittedPayments = personSubmittedRecords
            .filter(record => record.type === 'payment')
            .reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);


            const submittedCredits = personSubmittedRecords
            .filter(record => record.type === 'credit')
            .reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);
        // Calculate final credit
        const pendingCredit = (submittedCredits + totalSaleAmount) - (totalPayments + submittedPayments);
        
        // Check if there's excess payment
        const hasExcessPayment = pendingCredit < 0;
        const excessAmount = Math.abs(Math.min(pendingCredit, 0));

        return {
            personId: personId,
            totalSales: totalSaleAmount,
            totalPayments: totalPayments + submittedPayments,
            pendingCredit: Math.max(pendingCredit, 0),
            excessPayment: excessAmount,
            hasExcessPayment: hasExcessPayment,
            isOverLimit: pendingCredit > 0,
            creditStatus: pendingCredit > 0 ? 'PENDING' : 
                         hasExcessPayment ? 'EXCESS_PAYMENT' : 'CLEAR'
        };
    } catch (error) {
        console.error('Error calculating credit:', error);
        return {
            personId: personId,
            totalSales: 0,
            totalPayments: 0,
            pendingCredit: 0,
            isOverLimit: false,
            creditStatus: 'ERROR',
            error: error.message
        };
    }
};