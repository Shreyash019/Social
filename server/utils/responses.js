module.exports = {

    eventsZarGeneralResponse: function(req, res, statusCode, jsonData){
        if(req.user) req.user = undefined;
        if(res.req.user) res.req.user = undefined;
        res.status(statusCode).json(jsonData);
    }
}