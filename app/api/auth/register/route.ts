import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase, hasDatabaseUri } from "@/lib/db";
import User from "@/models/user";

export async function POST(request:NextRequest){
    try{
        if(!hasDatabaseUri()){
            return NextResponse.json(
                {error:"Add MONGODB_URI to .env before creating accounts"},
                {status:503}
            )
        }

        const {email, password} = await request.json()
        const normalizedEmail = email?.trim().toLowerCase()

        if(!normalizedEmail || !password){
            return NextResponse.json({error:"Email and password are required"}, {status:400})
        }

        if(password.length < 6){
            return NextResponse.json({error:"Password must be at least 6 characters"}, {status:400})
        }

        await connectToDatabase()
        const existingUser = await User.findOne({email: normalizedEmail})

        if(existingUser){
            return NextResponse.json({error:"User already exist"},{status:400})
        }
        await User.create({
            email: normalizedEmail,
            password,
        })
        return NextResponse.json({message:"User created successfully"}, {status:201})
    }
    catch(error){
        if(process.env.NODE_ENV !== "development"){
            console.error("Registration error :",error)
        }
        return NextResponse.json({error:"Failed to register user"},{status:500})
    }
}
