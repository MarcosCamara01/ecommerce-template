export function calculateExpectedDeliveryDate() {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay();
  const daysToAdd = dayOfWeek >= 5 ? 5 : 3;

  const addWeekdays = (date: any, days: number) => {
    const newDate = new Date(date);
    let addedDays = 0;
    while (addedDays < days) {
      newDate.setDate(newDate.getDate() + 1);
      if (newDate.getDay() >= 1 && newDate.getDay() <= 5) {
        addedDays++;
      }
    }
    return newDate;
  };

  const deliveryDate = addWeekdays(currentDate, daysToAdd);
  return deliveryDate;
}

export function generateRandomOrderNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let orderId = "";
  const length = 10;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    orderId += chars.charAt(randomIndex);
  }

  return orderId;
}
