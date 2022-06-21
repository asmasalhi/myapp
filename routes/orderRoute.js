const { v4: uuidv4 } = require("uuid");
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51L7LQ1HDXRSJrbqU2XjsW4KTBqvmtpgeaxyHk4h2pyPrK89Xh1WmbDnNWEBXObub8LL9YfigbnVWdupq14XG3Gpz00glAdbuFU"
);
const Order = require("../models/orderModel");

router.post("/placeorder", async (req, res) => {
  const { token, cartItems, currentUser, subtotal } = req.body;

  const customer = await stripe.customers.create({
    email: token.email,
    source: token.id,
  });

  const payment = await stripe.charges.create(
    {
      amount: subtotal * 100,
      currency: "TTD",
      customer: customer.id,
      receipt_email: token.email,
    },
    {
      idempotencyKey: uuidv4(),
    }
  );

  if (payment) {
    const order = new Order({
      userid: currentUser._id,
      name: currentUser.username,
      email: currentUser.email,
      orderItems: cartItems,
      shippingAddress: {
        address: token.card.address_line1,
        city: token.card.address_city,
        country: token.card.address_country,
        postalCode: token.card.address_zip,
      },
      orderAmount: subtotal,
      transactionId: payment.source.id,
      isDelivered: false,
    });

    order.save((err) => {
      if (err) {
        return res.status(400).json({ message: "Somethnig wrong!" });
      } else {
        return res.send("Order Placed Successfully");
      }
    });
  } else {
    return res.status(400).json({ message: "Payment Failed!" });
  }


});

router.post("/getordersbyuserid", (req, res) => {
  const userid = req.body.userid

  Order.find({ userid: userid }, (err, docs) => {
    if(err)
    {
      res.status(400).json({ message: "Something wrong!" });
    }
    else{
      res.send(docs)
    }
  });
});

router.get("/getallorders", (req, res) => {
  Order.find({}, (err, docs) => {
    if(err)
    {
      res.status(400).json({ message: "Something wrong!" });
    }
    else{
      res.send(docs)
    }
  });

});

module.exports = router;
