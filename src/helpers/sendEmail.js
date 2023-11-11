export const sendEmail = async (data) => {
    const emailCustomer = {
        name: data.customer_details.name,
        email: data.customer_details.email,
        message: "Your purchase has been successfully completed and will be delivered in the next few days.",
        subject: "Successful purchase"
    };

    const emailOwner = {
        name: "Marcos",
        email: "marcospenelascamara@gmail.com",
        message: `${data.customer_details.name} has made a new purchase, his/her email is: ${data.customer_details.email}`,
        subject: "A new purchase"
    };

    try {
        const responseCustomer = await fetch('/api/email', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailCustomer),
        });

        if (!responseCustomer.ok) {
            console.log("falling over")
            throw new Error(`response status: ${responseCustomer.status}`);
        } else {
            console.log("Customer's email successfully sent");
        }

        const responseEmailOwner = await fetch('/api/email', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailOwner),
        });

        if (!responseEmailOwner.ok) {
            throw new Error(`response status: ${responseEmailOwner.status}`);
        } else {
            console.log("Owner's email sent correctly");
        }

    } catch (err) {
        console.error(err);
        alert("Error, please try resubmitting the form");
    }
}