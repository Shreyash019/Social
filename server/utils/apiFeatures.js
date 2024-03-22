class ApiFeatures {
    constructor(query, queryStr) {
        this.query = query
        this.queryStr = queryStr
    }

    // Search feature
    search() {
        const uenm = this.queryStr.uenm ? { username: { $regex: this.queryStr.uenm, $options: "i", } } : {};
        this.query = this.query.find({ ...uenm })
        return this
    }

    // Filter
    filter() {
        // Creating copy of QueryStr Object
        const queryCopy = { ...this.queryStr }
        const removeFields = ["keyword", "page", "limit"];
        removeFields.forEach(key => delete queryCopy[key]);
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, key => `$${key}`)
        this.query = this.query.find(JSON.parse(queryStr));
        return this
    }

    // Price filter and Rating
    pagination(resultPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        // Skip(No of product we need to skip) like navigation 1st->0-5 then 2nd-> 6-10 .....
        const skip = resultPerPage * (currentPage - 1);
        this.query = this.query.limit(resultPerPage).skip(skip)
        return this;
    }

    // Followers Followings Pagination
    List_Data_Pagination(resultPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const limit = currentPage * resultPerPage
        this.query = this.query.slice((limit - resultPerPage), limit)
        return this;
    }

    // Search feature
    List_Data_Search() {
        const filterOptions = Object.entries(this.queryStr)
        for(let i=0; i<filterOptions.length; i++){
            if(filterOptions[i][0] === 'uenm' && filterOptions[i][1]){
                let filterData = this.queryStr.uenm.toLowerCase();
                let matchedUsers = this.query.filter((data)=>{
                    if(data.username){
                        const tempFilteredData = data.username.toLowerCase();
                        let isIncludes = tempFilteredData.includes(filterData)
                        if(isIncludes){
                            return data
                        }
                    }
                })
                this.query = matchedUsers
            }
            if(filterOptions[i][0] === 'fnnm' && filterOptions[i][1]){
                let filterData = this.queryStr.fnnm.toLowerCase();
                let matchedUsers = this.query.filter((data)=>{
                    if(data.firstname){
                        const tempFilteredData = data.firstname.toLowerCase();
                        let isIncludes = tempFilteredData.includes(filterData)
                        if(isIncludes){
                            return data
                        }
                    }
                })
                this.query = matchedUsers
            }
        }
        return this
    }
}

export default ApiFeatures;