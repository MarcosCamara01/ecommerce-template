import { Schema, model, models } from "mongoose";

function calculateExpectedDeliveryDate() {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const daysToAdd = dayOfWeek >= 5 ? 5 : 3;

    // Función para agregar días laborables a la fecha
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

const ProductsSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    color: {
        type: String,
        required: false,
    },
    size: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: false,
    },
});

const AddressSchema = new Schema({
    city: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    line1: {
        type: String,
        required: true,
    },
    line2: {
        type: String,
        required: false,
    },
    postal_code: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
});

const OrderSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: false,
    },
    address: AddressSchema,
    products: {
        type: [ProductsSchema],
        required: true
    },
    orderId: {
        type: String,
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
    expectedDeliveryDate: {
        type: Date,
        default: calculateExpectedDeliveryDate,
    },
    total_price: {
        type: Number,
        required: true,
    },
    orderNumber: {
        type: String,
        required: true,
    }
});

const OrdersSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    orders: {
        type: [OrderSchema],
        default: [],
    },
});

export const Orders = models.Orders || model("Orders", OrdersSchema);