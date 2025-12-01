import React from 'react'
import PageHeader from '../../components/PageHeader'
import SEO from '../../components/SEO'

const RefundPolicy = () => {
  return (
    <div>
      <SEO
        title="Refund Policy | A Figure A Day"
        description="Our customer-friendly refund and cancellation policy. We ensure your figures arrive safe and sound."
        canonical="https://www.afigureaday.com/refund-policy"
      />
      <PageHeader title="Refund Policy" curPage="Refund Policy"></PageHeader>

      <div className='container' style={{ paddingBottom: "50px", maxWidth: "800px" }}>

        {/* Intro */}
        <div style={{ marginBottom: "30px" }}>
          <p>At <strong>A Figure A Day</strong>, we want you to build your collection with confidence. We understand that collecting figures is a passion, and we aim to make your experience as smooth as possible.</p>
        </div>

        {/* Section 1: Cancellations */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "10px", marginBottom: "15px" }}>1. Order Cancellations</h3>
          <p>We understand that plans change. Because we value your peace of mind, our cancellation policy is flexible:</p>
          <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "10px" }}>
            <li style={{ marginBottom: "10px" }}>
              <strong>Before Confirmation (Risk-Free):</strong> You can request a full cancellation <strong>free of charge</strong> at any time <strong>before you receive the official payment receipt</strong> via email. Since we verify stock before capturing payment, your card is not charged until this receipt is sent.
            </li>
            <li>
              <strong>After Confirmation:</strong> Once the <strong>official payment receipt has been sent</strong> to your email, your order is considered processed and secured. At this stage, we cannot cancel it. However, you are welcome to return the item once it arrives (see details below).
            </li>
          </ul>
        </div>

        {/* Section 2: Damaged / Defective */}
        <div style={{ marginBottom: "30px" }}>
          {/* Fixed quotes here: "Arrive Safe" -> &quot;Arrive Safe&quot; */}
          <h3 style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "10px", marginBottom: "15px" }}>2. Damaged or Defective Items (&quot;Arrive Safe&quot; Guarantee)</h3>
          <p>Shipping can be rough, but we have you covered. If your figure arrives significantly damaged, broken, or with major defects:</p>

          <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderLeft: "4px solid #4CAF50", margin: "15px 0" }}>
            <strong>✅ No Return Needed for Major Damage:</strong> For significant damage, you do <em>not</em> need to ship the item back to us (saving you expensive international shipping costs).
          </div>

          <p><strong>How to claim:</strong></p>
          <ol style={{ paddingLeft: "20px", marginTop: "10px" }}>
            <li style={{ marginBottom: "10px" }}>
              <strong>Contact us within 7 days of delivery:</strong>
              <ul style={{ marginTop: "5px", listStyleType: "circle", paddingLeft: "20px" }}>
                <li style={{ marginBottom: "5px" }}>Email: <strong>figureaday.store@gmail.com</strong></li>
              </ul>
            </li>
            <li style={{ marginBottom: "10px" }}>Include your Order Number.</li>
            <li>Attach clear <strong>PHOTOS</strong> of the damaged product and the packaging (Video is optional but helpful).</li>
          </ol>
          <p style={{ marginTop: "15px" }}>We will review your claim and offer a <strong>free replacement</strong> or a <strong>full refund</strong> immediately.</p>
        </div>

        {/* Section 4: Disclaimer - Fixed quotes in this section */}
        <div style={{ marginTop: "40px", padding: "20px", border: "1px solid #e0e0e0", backgroundColor: "#fffbea", borderRadius: "5px" }}>
          <p style={{ fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
            Please note that for certain budget-friendly figures listed as <em>&quot;China Ver.&quot;</em>, <em>&quot;Third Party&quot;</em>, or <em>&quot;Domestic Ver.&quot;</em>, minor paint imperfections or slight box damage during transit may occur. These are standard for this category of figures and are not considered &quot;defects&quot; eligible for a full refund. However, if the figure is broken or missing parts, our <strong>&quot;Arrive Safe&quot; Guarantee</strong> still applies.
          </p>
        </div>

      </div>
    </div>
  )
}

export default RefundPolicy