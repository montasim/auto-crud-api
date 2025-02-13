import mongoose, { model, Schema } from 'mongoose';

function mongooseModelFactory(modelName, schemaDefinition) {
    const schema = new Schema(schemaDefinition, {
        timestamps: true,
        versionKey: false,
    });
    return mongoose.models[modelName] || model(modelName, schema);
}

export default mongooseModelFactory;
