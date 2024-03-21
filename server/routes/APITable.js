import express from "express";
import consumerAccountRoute from "./Consumer/consumerAccountRoute.js";
import postRoutes from './PostRoutes/postRoute.js';

const router = express.Router();

router.use("/consumer", consumerAccountRoute);
router.use("/feed", postRoutes);

export default router;