import React from 'react'
import { Skeleton } from '../ui/skeleton';

const OrderSkeleton = () => {
  const detailsH3Styles = "text-lg font-bold mb-5";
  const bxInfoStyles = "w-full flex justify-between mt-3.5 text-sm text-999";
  const detailsLiStyles = "mt-2.5	text-sm	text-999";

  return (
    <div className='h-full grow sm:basis-800 sm:sticky top-8'>
      <div className='mb-10'>
        <h3 className={detailsH3Styles}>Order Details</h3>
        <div className={bxInfoStyles}><span>Order Number</span> <span><Skeleton className="h-4 w-[120px]" /></span></div>
        <div className={bxInfoStyles}><span>Order Date</span> <span><Skeleton className="h-4 w-[100px]" /></span></div>
        <div className={bxInfoStyles}><span>Expected Delivery Date</span> <span><Skeleton className="h-4 w-[100px]" /></span></div>
      </div>
      <div className='pt-10 mb-10 border-t border-solid border-border-primary'>
        <h3 className={detailsH3Styles}>Delivery Address</h3>
        <ul>
          <li className={detailsLiStyles}><Skeleton className="h-4 w-[120px]" /></li>
          <li className={detailsLiStyles}><Skeleton className="h-4 w-[130px]" /></li>
          <li className={detailsLiStyles}><Skeleton className="h-4 w-[140px]" /></li>
          <li className={detailsLiStyles}><Skeleton className="h-4 w-[110px]" /></li>
          <li className={detailsLiStyles}><Skeleton className="h-4 w-[150px]" /></li>
        </ul>
      </div>
      <div className='pt-10 border-t border-solid border-border-primary'>
        <h3 className={detailsH3Styles}>Totals</h3>
        <div className={bxInfoStyles}><span></span> <span><Skeleton className="h-4 w-[80px]" /></span></div>
        <div className={bxInfoStyles}><span>Delivery</span> <span>FREE</span></div>
        <div className={bxInfoStyles}><span>Total Discount</span> <span>0 €</span></div>
        <div className={bxInfoStyles}><span>Total</span> <span><Skeleton className="h-4 w-[80px]" /></span></div>
        <div className={bxInfoStyles}>(VAT included)</div>
      </div>
    </div>
  )
}

export default OrderSkeleton
