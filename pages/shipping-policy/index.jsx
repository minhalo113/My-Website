import React from 'react'
import PageHeader from '../components/PageHeader'

const ShippingPolicy = () => {
  return (
    <div>
        <PageHeader title = "Shipping Policy" curPage="Shipping Policy"></PageHeader>
        <div className='container'>
        <p><strong>Shipping Policy</strong></p>
        <p>Thank you for choosing Toy Haven! We are committed to providing you with a seamless shopping experience. Please review the following information regarding our shipping and delivery policies:</p>

        <p><strong>Shipping Methods and Timelines:</strong></p>
        <p>We offer flat-rate shipping for a fixed cost and free shipping on orders over $100 CAD.</p>
        <p>Orders are typically processed within 1-3 business days, excluding weekends and holidays. Once your order is processed, you will receive a confirmation email with tracking information. Delivery times may vary based on your location and the chosen shipping method.</p>

        <p><strong>Shipping Costs:</strong></p>
        <p>Shipping costs are calculated based on orders and destination. You can view the shipping costs for your order during the checkout process.</p>

        <p><strong>Delivery Delays:</strong></p>
        <p>While we strive to deliver your order in a timely manner, please understand that delivery delays may occur due to unforeseen circumstances such as weather conditions or carrier issues.</p>
        <p>If you experience any delays with your order, please contact us, and we will assist you accordingly.</p>

        <p><strong>Order Tracking:</strong></p>
        <p>You can track the status of your order using the tracking information provided in your confirmation email.</p>
        <p>If you have any questions or concerns about your order's status, please don't hesitate to contact our customer support team.</p>

        <p><strong>Shipping Restrictions:</strong></p>
        <p>We are unable to ship to P.O. boxes or APO/FPO addresses.</p>
        <p>Some items may have shipping restrictions due to size, weight, or destination. Please refer to the product page for more information.</p>

        <p><strong>Returns and Exchanges:</strong></p>
        <p>For information about returns and exchanges, please refer to our <a title="Refund Policy" href="/refund-policy" target="_blank">Refund Policy</a>.</p>

        <p><strong>Contact Us:</strong></p>
        <p>If you have any further questions or need assistance, please don't hesitate to contact our customer support team at ahistoryfactaday@gmail.com.</p>
        </div>
    </div>
  )
}

export default ShippingPolicy