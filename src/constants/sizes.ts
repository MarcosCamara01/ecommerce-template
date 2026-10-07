/**
 * The sizes a piece can come in, smallest first. They mirror the `sizes`
 * enum of the database schema, in a file of their own: a component that only
 * lists them must not pull the schema, and the validation library with it,
 * into the browser.
 */
export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
