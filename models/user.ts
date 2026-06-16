import bcrypt from "bcryptjs";
import mongoose, { model } from "mongoose";
export interface IUser{
    email:string
    password:string
    _id?:mongoose.Types.ObjectId
    createdAt?:Date
    updatedAt?:Date
}
const userSchema = new mongoose.Schema<IUser>({
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true}
},{
    timestamps:true
})
userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

const User = mongoose.models.User || model<IUser>("User", userSchema)

export default User