import { NextRequest, NextResponse } from "next/server";
import { compileCanvasTsx } from "@/lib/remotion/compile";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { tsxCode } = await req.json();

    if (!tsxCode || typeof tsxCode !== "string") {
      return NextResponse.json(
        { error: "tsxCode krävs" },
        { status: 400 }
      );
    }

    if (tsxCode.length > 20000) {
      return NextResponse.json(
        { error: "tsxCode är för lång (max 20000 tecken)" },
        { status: 400 }
      );
    }

    const result = await compileCanvasTsx(tsxCode);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ compiledJs: result.compiledJs });
  } catch (error) {
    console.error("Motion compile error:", error);
    return NextResponse.json(
      { error: "Något gick fel vid kompilering" },
      { status: 500 }
    );
  }
}
