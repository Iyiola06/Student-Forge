/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
// @ts-ignore
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs';

import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 second background processing budget

import { createClient } from '@supabase/supabase-js';

async function processResource(
    filePath: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    resourceId: string,
    accessToken: string
) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        }
    );

    try {
        // Download from storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('resources')
            .download(filePath);

        if (downloadError || !fileData) throw new Error('Failed to download file for processing');

        let extractedText = '';

        if (fileType === 'application/pdf') {
            const arrayBuffer = await fileData.arrayBuffer();
            let nativeText = '';
            
            try {
                // Try to extract native text using pdfjs-dist server-side
                const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
                const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), useSystemFonts: true });
                const pdfDoc = await loadingTask.promise;
                
                for (let i = 1; i <= Math.min(pdfDoc.numPages, 100); i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    nativeText += pageText + "\n";
                }
            } catch (pdfErr) {
                console.warn("pdfjs extraction failed, falling back to OCR", pdfErr);
            }

            extractedText = nativeText.trim();
            
            // If the PDF is mostly images (scanned) or extraction failed, fallback to Gemini OCR
            if (extractedText.length < 50) {
                if (!process.env.GEMINI_API_KEY) throw new Error('AI extraction not configured');
                // Use the ultra fast model for OCR
                const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
                const base64Data = Buffer.from(arrayBuffer).toString('base64');
                const result = await model.generateContent([
                    'Extract and transcribe all readable text from this PDF document. Preserve structure. Only output the text content, no commentary.',
                    { inlineData: { data: base64Data, mimeType: 'application/pdf' } }
                ]);
                extractedText = result.response.text().trim();
            }
            
            if (extractedText.length < 50) {
                throw new Error('Insufficient text extracted. The document may be empty, image-heavy, or encrypted.');
            }
        } else if (fileType.startsWith('image/')) {
            if (!process.env.GEMINI_API_KEY) throw new Error('OCR not configured');
            const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
            const arrayBuffer = await fileData.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const result = await model.generateContent([
                'Transcribe all readable text from this study material image. Format it cleanly. If there are diagrams, describe them briefly.',
                { inlineData: { data: base64Data, mimeType: fileType } },
            ]);
            extractedText = result.response.text().trim();
            if (extractedText.length < 20) throw new Error('Could not extract meaningful text from image. Please ensure the image is clear and contains text.');
        } else if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx')
        ) {
            const mammoth = await import('mammoth');
            const arrayBuffer = await fileData.arrayBuffer();
            const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
            extractedText = result.value.trim();
            if (extractedText.length < 50) throw new Error('The DOCX file appears to have insufficient text content.');
        } else if (
            fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            fileName.endsWith('.pptx')
        ) {
            const JSZip = (await import('jszip')).default;
            const arrayBuffer = await fileData.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const slideFiles = Object.keys(zip.files)
                .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
                .sort();
            let fullText = '';
            for (const slidePath of slideFiles) {
                const xmlContent = await zip.files[slidePath].async('text');
                const textMatches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g);
                if (textMatches) {
                    fullText += textMatches.map((m: string) => m.replace(/<\/?a:t>/g, '')).join(' ') + '\n';
                }
            }
            extractedText = fullText.trim();
            if (extractedText.length < 50) throw new Error('The PPTX file appears to have insufficient text content.');
        } else if (
            fileType === 'application/vnd.ms-powerpoint' ||
            fileName.endsWith('.ppt')
        ) {
            // .ppt is the legacy binary OLE format — JSZip can't parse it.
            // Send to Gemini with the correct MIME type for text extraction.
            if (!process.env.GEMINI_API_KEY) throw new Error('AI extraction not configured');
            const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
            const arrayBuffer = await fileData.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const result = await model.generateContent([
                'Extract and transcribe all readable text from this PowerPoint presentation file. Go slide by slide. Format each slide as a numbered section. Only output the text content, no commentary.',
                { inlineData: { data: base64Data, mimeType: 'application/vnd.ms-powerpoint' } },
            ]);
            extractedText = result.response.text().trim();
            if (extractedText.length < 50) throw new Error('Could not extract meaningful text from this .ppt file.');
        } else if (fileType === 'text/plain' || fileType === 'application/json') {
            extractedText = await fileData.text();
            if (extractedText.trim().length < 10) throw new Error('The text file is empty or too short.');
        }

        // Update the resource with content and mark as ready
        await supabase
            .from('resources')
            .update({
                content: extractedText,
                processing_status: 'ready',
                processing_error: null,
            })
            .eq('id', resourceId);
    } catch (err: any) {
        console.error(`[process] Error processing resource ${resourceId}:`, err.message);
        await supabase
            .from('resources')
            .update({
                content: '', // Ensure content is empty on error
                processing_status: 'error',
                processing_error: err.message,
            })
            .eq('id', resourceId);
    }
}

export async function POST(request: Request) {
    try {
        const { supabase, user, accessToken } = await createAuthedRouteClient(request);
        if (!user || !accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filePath, fileName, fileType, fileSize, extractedText } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('resources')
            .getPublicUrl(filePath);

        if (extractedText) {
            // ── Fast path: text was already extracted client-side ──────────
            // Just insert the record with the pre-extracted content. No file download needed.
            const { error: dbError } = await supabase
                .from('resources')
                .insert({
                    user_id: user.id,
                    title: fileName,
                    subject: 'General',
                    file_url: publicUrl,
                    file_type: fileType,
                    file_size_bytes: fileSize,
                    content: extractedText,
                    processing_status: 'ready',
                    processing_error: null,
                });

            if (dbError) return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });

            return NextResponse.json({ success: true, status: 'ready' }, { status: 200 });
        }

        // ── Slow path: image OCR via Gemini (server-side only) ────────────
        // Insert record first with processing status
        const { data: resourceData, error: dbError } = await supabase
            .from('resources')
            .insert({
                user_id: user.id,
                title: fileName,
                subject: 'General',
                file_url: publicUrl,
                file_type: fileType,
                file_size_bytes: fileSize,
                content: '',
                processing_status: 'processing',
            })
            .select()
            .single();

        if (dbError || !resourceData) {
            return NextResponse.json({ error: 'Failed to create resource record' }, { status: 500 });
        }

        // Process the file synchronously — no fire-and-forget, result is reliable
        await processResource(filePath, fileName, fileType, fileSize, resourceData.id, accessToken);

        // Return the final status directly from this same request
        return NextResponse.json(
            { success: true, status: 'processed', resourceId: resourceData.id },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Process route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
