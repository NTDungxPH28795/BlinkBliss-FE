import React, { useState } from 'react';

const PaymentComponent = () => {
    const [paymentUrl, setPaymentUrl] = useState('');
    console.log(paymentUrl)
    const initiatePayment = async () => {
        try {
            // Make an API request to your server to initiate the payment
            const response = await fetch('http://localhost:8888/order/create_payment_url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: 1000000, // Example amount
                    bankCode: 'INTCARD', // Example bank code
                    language: 'vn', // Example language
                }),
            });

            const data = await response.json();

            setPaymentUrl(data.paymentUrl);

            window.location.href = data.paymentUrl;
        } catch (error) {
            console.error('Error initiating payment:', error);
        }
    };

    return (
        <div>
            <button onClick={initiatePayment}>Initiate Payment</button>

            <div>
                <h2>Payment Details</h2>
                <p>Payment URL: {paymentUrl}</p>
            </div>
        </div>
    );
};

export default PaymentComponent;
