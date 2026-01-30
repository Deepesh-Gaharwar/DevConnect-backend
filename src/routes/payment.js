const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorPay");
const PaymentModel = require("../models/payments");
const { membershipAmount } = require("../utils/constants");
const {validateWebhookSignature} = require("razorpay/dist/utils/razorpay-utils")

paymentRouter.post("/payment/create", userAuth, async (req, res) => {

    try {

        const { firstName, lastName, emailId } = req.user;
        const {membershipType} = req.body;

        const amount = membershipAmount[membershipType];

        if (!amount) {
          return res.status(400).json({ msg: "Invalid membership type" });
        }
        
        const order = await razorpayInstance.orders.create({
          amount: amount * 100,
          currency: "INR", 
          receipt: "receipts#1",
          notes: {
            firstName,
            lastName,
            emailId,
            membershipType: membershipType,
          },
        });

        // save it in my DB
        const payment = new PaymentModel({
            userId: req.user._id,
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes,
        });

        const  savedPayment = await payment.save();

        // return back my order details to frontend
        res.status(200).json({...savedPayment.toJSON()});

    } catch (error) {
        return res.status(500).json({msg: error.message})
    }

});

//webHook API
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const WebhookSignature =
      req.headers[process.env.RAZORPAY_WEBHOOK_SIGNATURE];

    const isWebHookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      WebhookSignature,
      webhookSecret,
    );

    if (!isWebHookValid) {
      return res.status(400).json({ msg: "WebHook signature is invalid!" });
    }

    // update my payment status in DB
    const paymentDetails = req.body.payload.payment.entity;

    const payment = await PaymentModel.findOne({orderId: paymentDetails.order_id});

    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }

    //update status
    payment.status = paymentDetails.status;

    await payment.save(); // saved to DB


    const user = await User.findOne({_id: payment.userId});

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.isPremium = true;
    user.membershipType = payment.notes.membershipType;

    await user.save();

    // update the user as premium

    // if (req.body.event == "payment.captured") {
    // }

    // if (req.body.event == "payment.failed") {
    // }

    // return success response to razorpay
    return res.status(200).json({ msg: "WebHook received successfully" });

  } catch (error) {
    return res.status(500).json({msg: error.message});
  }
});

// to check whether the user is set to premium or not
paymentRouter.get("/premium/verify", userAuth, async(req, res) => {

  try {

    const user = req.user;

    // return a response, whether premium or not
    return res.status(200).json({
      isPremium: user.isPremium || false,
      membershipType: user.membershipType || null,
    });

  } catch (error) {
     
    return res.status(500).json({
      isPremium: false,
      msg: error.message,
    });

  }

});

module.exports = paymentRouter;  