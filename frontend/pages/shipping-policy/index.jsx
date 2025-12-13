import React from 'react'
import PageHeader from '../../components/PageHeader'
import SEO from '../../components/SEO'

const ShippingPolicy = () => {
  return (
    <div>
      <SEO
        title="Shipping Policy | A Figure A Day"
        description="Learn about shipping times, carriers, and delivery policies for A Figure A Day orders."
        canonical="https://www.afigureaday.com/shipping-policy"
      />
      <PageHeader title="Shipping Policy" curPage="Shipping Policy"></PageHeader>
      <div className='container'>
        <p><strong>Shipping Policy</strong></p>
        <p>Thank you for choosing A Figure A Day! We are committed to providing you with a seamless shopping experience. Please review the following information regarding our shipping and delivery policies:</p>

        <p><strong>Shipping Methods and Timelines:</strong></p>
        <p>Orders are typically processed within 1-3 business days, excluding weekends and holidays. Once your order is processed, you will receive a receipt email. Delivery times may vary based on your location.</p>

        <p><strong>Delivery Delays:</strong></p>
        <p>While we strive to deliver your order in a timely manner, please understand that delivery delays may occur due to unforeseen circumstances such as weather conditions or carrier issues.</p>
        <p>If you experience any delays with your order, please contact us, and we will assist you accordingly.</p>

        <p><strong>Order Tracking:</strong></p>
        <p>You can track the status of your order using the tracking information provided in your order confirmation email.</p>
        <p>If you have any questions or concerns about your order&apos;s status, please don&apos;t hesitate to contact us through email at figureaday.store@gmail.com.</p>

        <p><strong>Returns and Exchanges:</strong></p>
        <p>For information about returns and exchanges, please refer to our <a title="Refund Policy" href="/refund-policy" target="_blank">Refund Policy</a>.</p>

        <p><strong>Contact Us:</strong></p>
        <p>If you have any further questions or need assistance, please don&apos;t hesitate to contact our customer support team at figureaday.store@gmail.com.</p>
      </div>
    </div>
  )
}

export default ShippingPolicy
