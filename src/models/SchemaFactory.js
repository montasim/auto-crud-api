import { model, Schema } from 'mongoose';

function buildMongooseModel(modelName, schemaDefinition) {
    const schema = new Schema(schemaDefinition, {
        timestamps: true,
        versionKey: false,
    });
    return model(modelName, schema);
}

export default buildMongooseModel;
