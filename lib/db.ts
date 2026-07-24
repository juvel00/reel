import mongoose from "mongoose";

let cached = global.mongoose
if(!cached){
    cached = global.mongoose={conn:null, promise:null}
}

export function hasDatabaseUri() {
    return Boolean(process.env.MONGODB_URI)
}

export async function connectToDatabase(){
    const MONGODB_URI = process.env.MONGODB_URI
    if(!MONGODB_URI){
        throw new Error("Please enter connection URI in the .env file")
    }
    if(cached.conn){
        return cached.conn
    }
    if(!cached.promise){
        const opts ={
            bufferCommands:true,
            maxPoolSize:10
        }
        cached.promise = mongoose.connect(MONGODB_URI,opts).then(()=>mongoose.connection)
    }
    try{
        cached.conn = await cached.promise
    } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
