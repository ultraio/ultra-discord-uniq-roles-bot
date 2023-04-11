export default interface Response<Data = string> {
    status: boolean;
    data: Data;
}
