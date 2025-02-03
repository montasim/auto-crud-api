import { model, Schema } from 'mongoose';

function createMongooseModel(modelName, schemaDefinition) {
    const schema = new Schema(schemaDefinition, {
        timestamps: true,
        versionKey: false,
    });
    return model(modelName, schema);
}

export default createMongooseModel;
