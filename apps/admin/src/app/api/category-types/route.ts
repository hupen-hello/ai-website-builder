import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import CategoryType from "@/models/CategoryType";

export async function GET() {
  try {
    await connectMongoDB();
    const types = await CategoryType.find().sort({ createdAt: -1 });
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch types" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, slug, description, status } = await req.json();
    await connectMongoDB();
    
    const newType = await CategoryType.create({ name, slug, description, status });
    return NextResponse.json({ message: "Type Created", type: newType }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create type" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
    
    await connectMongoDB();
    const CategoryType = require("@/models/CategoryType").default; 
    await CategoryType.findByIdAndDelete(id);
    return NextResponse.json({ message: "Type Deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete type" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { _id, ...updateData } = data;

    if (!_id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await connectMongoDB();
    const CategoryType = require("@/models/CategoryType").default; 
    const updatedType = await CategoryType.findByIdAndUpdate(_id, updateData, { new: true });
    
    return NextResponse.json({ message: "Type Updated", type: updatedType }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update type" }, { status: 500 });
  }
}