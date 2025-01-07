import React from 'react'

// Utility function for updating items in an array
export const updateItem = (items, id, updatedItem) =>
    items.map(item => (item.id == id ? { ...item, ...updatedItem } : item));

// Utility function for deleting items from an array
export const deleteItem = (items, id) => items.filter(item => item.id !== id);
// //Utility function for deleting items from an array
// export const deleteItem = (items, id) => items.filter(item => item.salesRefNo !== id);