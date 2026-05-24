import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is missing.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using flash as it is much faster for real-time applications
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert the File to base64 for Gemini inlineData
    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    // Default to audio/webm if type is missing, matching the frontend MediaRecorder
    const mimeType = file.type || 'audio/webm';

    const prompt = language 
      ? `Transcribe the following audio exactly as spoken. The audio is in language code "${language}". Output ONLY the transcription, without any markdown formatting, conversational filler, or extra text.`
      : `Transcribe the following audio exactly as spoken. Output ONLY the transcription, without any markdown formatting, conversational filler, or extra text.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      },
    ]);

    const text = result.response.text().trim();
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed' }, { status: 500 });
  }
}
