import { Types } from 'mongoose';

const convertToMongooseObjectId = (id) => new Types.ObjectId(id);

export default convertToMongooseObjectId;
