
const allAvailablePlanDetailsFormatting = function(plans){
    return plans.map((data) => {
        let formattedPlan = {
            _id: data._id,
            planName: data.planName,
            description: data.planDescription,
            country: data.Country,
            features: data.planFeatures,
        };
        return formattedPlan;
    })
}

const singlePlanDetailsFormatting = function(plan){
    let formattedPlan = {
        _id: plan._id,
        planName: plan.planName,
        description: plan.planDescription,
        country: plan.Country,
        features: plan.planFeatures,
    };
    return formattedPlan;
}

module.exports = {
    allAvailablePlanDetailsFormatting,
    singlePlanDetailsFormatting
}