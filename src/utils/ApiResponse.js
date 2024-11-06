class ApiResponse{
    constructor(statusCode, data, messsage = "Success"){
        this.success = statusCode < 400
        this.statusCode = statusCode
        this.data = data
        this.messsage = messsage
    }
}
export {ApiResponse}