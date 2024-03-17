import express from "express";
import consumerAccountRoute from "./Consumer/consumerAccountRoute.js";

const router = express.Router();

router.use("/consumer", consumerAccountRoute);

export default router;