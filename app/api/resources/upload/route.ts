import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}

export async function GET() {
    return NextResponse.json({ message: 'Resource upload endpoint' }, { status: 200 });
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filePath, fileName, fileType, fileSize } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
        }

        // 1. Download the file from Supabase Storage into memory
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('resources')
            .download(filePath);

        if (downloadError || !fileData) {
            console.error('Download error:', downloadError);
            return NextResponse.json({ error: 'Failed to download file for processing' }, { status: 500 });
        }

        // 2. Extract Text from PDF
        let extractedText = '';
        let isExtractionSuccessful = false;

        if (fileType === 'application/pdf') {
            try {
                // Dynamically import pdfjs-dist ONLY when needed inside the POST request to avoid top-level Vercel lambda crashes
                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

                const arrayBuffer = await fileData.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
                const pdfDocument = await loadingTask.promise;

                const numPages = pdfDocument.numPages;
                let fullText = '';

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDocument.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n';
                }

                extractedText = fullText.trim();

                if (extractedText.length > 50) {
                    isExtractionSuccessful = true;
                } else {
                    extractedText = "Text could not be extracted from this document. It may be a scanned image or protected PDF.";
                }
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError);
                extractedText = "An error occurred while attempting to parse text from this PDF.";
            }
        } else {
            extractedText = "Text extraction is currently only supported for PDF files.";
        }

        // 3. Save to database
        // Get public URL for the file
        const { data: { publicUrl } } = supabase.storage
            .from('resources')
            .getPublicUrl(filePath);

        const { data: resourceData, error: dbError } = await supabase
            .from('resources')
            .insert({
                user_id: user.id,
                title: fileName,
                subject: 'General',
                file_url: publicUrl,
                file_type: fileType,
                file_size_bytes: fileSize,
                content: extractedText,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: 'Failed to save resource metadata' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            resource: resourceData,
            textExtracted: isExtractionSuccessful
        });

    } catch (error: any) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            { error: error?.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
