import React from 'react'
import PageHeader from '../../components/PageHeader'
import SEO from '../../components/SEO'

const RefundPolicy = () => {
  return (
    <div>
        <SEO
            title="Refund Policy | A Figure A Day"
            description="Understand A Figure A Day's refund and cancellation policy for figure orders and preorders."
            canonical="https://www.afigureaday.com/refund-policy"
        />
        <PageHeader title="Refund Policy" curPage="Refund Plicy"></PageHeader>
        <div className='container'>
        <h2>Cancellations and Returns</h2>
        <p><strong>About Cancellations</strong></p>
        <p>We understand that during the online shopping process, you may change your mind. In order to provide you with an unparalleled shopping experience, below is our detailed policy on order cancellations, returns and refunds.</p>
        <div style={{ margin: "20px 0" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li
              style={{
                position: "relative",
                paddingLeft: "22px",
                margin: "10px 0",
                lineHeight: "1.6",
              }}
            >
              <span
                style={{ color: "#cc0000", fontWeight: "bold", position: "absolute", left: 0 }}
              >
                •
              </span>
              <span style={{ color: "#cc0000", fontWeight: "bold" }}>
                Cancellation period:
              </span>{" "}
              Ordered products can be canceled unconditionally before the payment was captured.
            </li>

            <li
              style={{
                position: "relative",
                paddingLeft: "22px",
                margin: "10px 0",
                lineHeight: "1.6",
              }}
            >
              <span
                style={{ color: "#cc0000", fontWeight: "bold", position: "absolute", left: 0 }}
              >
                •
              </span>
              <span style={{ color: "#cc0000", fontWeight: "bold" }}>
                After the payment was captured:
              </span>{" "}
              We will not be able to accept the refund because the payment and quota of reserved products have
              been submitted to the studio and have entered the preparation stage.
            </li>
          </ul>
        </div>
        <p><strong>About Cancellations</strong></p>
        <p>
          We will undoubtedly carefully select and carefully package the items you order to ensure that your items are not only of the highest possible quality, but also arrive safely at your designated shipping address. However, sometimes items do become damaged in transit, or have some form of manufacturing defect that renders the item unfit for its intended use. If this happens to your product, please immediately contact us through email to handle it.
        </p>
            <div style={{ margin: "20px 0" }}>
      {/* Red Note Section */}
      <p
        style={{
          color: "#cc0000",
          fontWeight: "bold",
          fontStyle: "italic",
          marginBottom: "8px",
        }}
      >
        *Note* :
      </p>
      <p
        style={{
          color: "#cc0000",
          lineHeight: "1.6",
          margin: "0 0 20px",
        }}
      >
Customers who purchase goods from us should note that all return, exchange, or compensation requests must be made within 72 hours of receiving the goods at their designated shipping address. Our professional assistants will help you process your application immediately after receiving it. If you receive a damaged or defective product, we will request photographic evidence of the package or the specific product in question. We will review the photo and discuss it with you as soon as possible.
      </p>
    </div>
        
            <div style={{ margin: "30px 0", border: "1px solid #ddd" }}>
      {/* Header with yellow background */}
      <div
        style={{
          backgroundColor: "yellow",
          padding: "10px",
          fontWeight: "bold",
          fontSize: "16px",
          borderBottom: "1px solid #ddd",
        }}
      >
        Instructions for taking photographic evidence of damaged products:
      </div>

      {/* Step 1 */}
      <div style={{ padding: "15px", fontSize: "15px", lineHeight: "1.6" }}>
        <p>
          <strong>1.</strong> After receiving the product, it is required to
          record the unboxing video and take photos of the damaged product
          together with the express delivery list.
        </p>
    
        {/* Step 2 */}
        <p>
          <strong>2.</strong> Once the damage information is
          approved, we will transfer compensation
          to the customer&apos;s account within 3–7 business days.
        </p>
      </div>
    </div>
    </div>
    </div>
    
  )
}

export default RefundPolicy
