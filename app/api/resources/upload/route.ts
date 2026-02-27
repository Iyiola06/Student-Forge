import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker for PDF.js in Node environment
// We use a trick to avoid the standard worker which doesn't play nicely with Next.js edge/node runtimes out of the box.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const subject = formData.get('subject') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // We assume a 'resources' bucket exists based on the RLS policies
        const { data: storageData, error: storageError } = await supabase.storage
            .from('resources')
            .upload(filePath, file);

        if (storageError) {
            console.error('Storage error:', storageError);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        // 2. Extract Text from PDF
        let extractedText = '';
        let isExtractionSuccessful = false;

        if (file.type === 'application/pdf') {
            try {
                const arrayBuffer = await file.arrayBuffer();
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
                title: title || file.name,
                subject: subject || 'General',
                file_url: publicUrl,
                file_type: file.type,
                file_size_bytes: file.size,
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
