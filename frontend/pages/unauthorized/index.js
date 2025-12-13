import React from "react"
import SEO from "../../components/SEO"

export const Unauthorized = () => {
    return (
        <div>
            <SEO
                title="Unauthorized | A Figure A Day"
                description="You do not have access to this page."
                canonical="https://www.afigureaday.com/unauthorized"
                noindex
            />
            <h1>Unauthorized Page</h1>
        </div>
    )
}

export default Unauthorized;

