import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import TemplateLayout from "@/models/TemplateLayout";

export async function GET() {
  try {
    await connectMongoDB();
    const layouts = await TemplateLayout.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(layouts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch layouts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (data._id === "") delete data._id;

    await connectMongoDB();

    // 1. Same category aur same section ke saare layouts DB se nikaal lo
    const existingLayouts = await TemplateLayout.find({ 
      category: data.category,
      sectionType: data.sectionType 
    }, 'sectionNumber name').lean();

    // 2. 🧠 SMART GAP-FILLING LOGIC
    const existingNumbers = existingLayouts
      .map((layout: any) => layout.sectionNumber || 0)
      .filter((n: number) => n > 0)
      .sort((a: number, b: number) => a - b);

    let nextAvailableNumber = 1;
    for (let i = 0; i < existingNumbers.length; i++) {
      if (existingNumbers[i] === nextAvailableNumber) {
        nextAvailableNumber++; // Number exist karta hai, aage badho
      } else if (existingNumbers[i] > nextAvailableNumber) {
        break; // Khali jagah (Gap) mil gayi!
      }
    }

    data.sectionNumber = nextAvailableNumber;

    // 3. 🚨 STRICT AUTO-NAMING LOGIC ("Header 1", "Header 2", etc.)
    const baseName = data.sectionType.replace(" Section", ""); // "Header Section" ko "Header" banayega
    
    // Check agar user ne galti se same naam manually type kar diya hai
    const isNameDuplicate = existingLayouts.some((l: any) => l.name?.toLowerCase() === (data.name || "").toLowerCase());

    // Agar naam khali hai, ya same hai, ya duplicate hai -> Force Auto Sequence!
    if (!data.name || data.name.trim() === "" || data.name === baseName || isNameDuplicate) {
      data.name = `${baseName} ${nextAvailableNumber}`; 
    }

    // 4. CLEAN SLUG GENERATION
    let generatedSlug = data.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-");
    
    // Duplicate Slug Backup (Ab random number ki jagah sequence number jodega)
    const existingSlug = await TemplateLayout.findOne({ slug: generatedSlug });
    if (existingSlug) {
      generatedSlug = `${generatedSlug}-${nextAvailableNumber}`;
    }
    
    data.slug = generatedSlug;

    // 5. Save in DB
    const newLayout = await TemplateLayout.create(data);
    return NextResponse.json({ message: "Layout Created", layout: newLayout }, { status: 201 });
    
  } catch (error: any) {
    console.error("DB POST ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to create layout" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { _id, ...updateData } = data;
    if (!_id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
    
    await connectMongoDB();

    // Edit ke time Slug ko update karna
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-");
    }

    const updatedLayout = await TemplateLayout.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ message: "Layout Updated", layout: updatedLayout }, { status: 200 });
  } catch (error: any) {
    console.error("DB PUT ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to update layout" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
    
    await connectMongoDB();
    await TemplateLayout.findByIdAndDelete(id);
    return NextResponse.json({ message: "Layout Deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DB DELETE ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to delete layout" }, { status: 500 });
  }
}