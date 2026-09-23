import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectMongoDB();
    
    return NextResponse.json(
      { message: " MongoDB Atlas connect" }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("DB Connection Error:", error);
    
    return NextResponse.json(
      { message: "Connection fail ", error }, 
      { status: 500 }
    );
  }
}