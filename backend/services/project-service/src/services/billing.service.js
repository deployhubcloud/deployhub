import { plans } from "../../../../shared/constants/plan.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { CompletedOrder } from "../models/completedOrder.model.js";
import { Project } from "../models/project.model.js";

export const getProjectBilling = async (projectId, userId) => {

    if (!projectId) {
        throw new AppError("ProjectId Required")
    }

    const filter = { _id: projectId };
    if (userId) filter.userId = userId;

    const billingDetails = await Project.findOne(filter).select("paymentId endDate startDate paymentStatus plan").lean();
    if (!billingDetails) {
        throw new AppError("Proejct not Found", 404);
    }

    const billingHistory = await CompletedOrder.find({ projectId }).select("razorpayPaymentId months amount plan status createdAt")
    const planDetails = plans[billingDetails.plan]

    return { ...billingDetails, planDeatils: { ...planDetails }, billingHistory: { ...billingHistory } }
}