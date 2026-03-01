import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

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
                // Use a more robust way to load pdfjs in Node.js
                // We'll use the legacy build and disable the worker for simplicity in serverless environments
                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

                const arrayBuffer = await fileData.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                const loadingTask = pdfjsLib.getDocument({
                    data: uint8Array,
                    useWorkerFetch: false,
                    isEvalSupported: false,
                    useSystemFonts: true
                });

                const pdfDocument = await loadingTask.promise;
                const numPages = pdfDocument.numPages;
                let fullText = '';

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDocument.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items
                        .map((item: any) => item.str)
                        .filter((str: string) => str.trim().length > 0)
                        .join(' ');
                    fullText += pageText + '\n';
                }

                extractedText = fullText.trim();

                if (extractedText.length > 20) {
                    isExtractionSuccessful = true;
                } else {
                    extractedText = ""; // Clear it so we don't save "Parsing failed" as content
                    return NextResponse.json({
                        error: 'Could not extract enough text from this PDF. It might be a scanned image (OCR required) or encrypted.',
                        textExtracted: false
                    }, { status: 422 });
                }
            } catch (pdfError: any) {
                console.error('PDF parsing error:', pdfError);
                return NextResponse.json({
                    error: `Failed to parse PDF: ${pdfError.message || 'Unknown error'}. Please try pasting the text manually.`,
                    textExtracted: false
                }, { status: 422 });
            }
        } else if (fileType.startsWith('image/')) {
            try {
                if (!apiKey) throw new Error('Gemini API key is not configured for OCR');

                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const arrayBuffer = await fileData.arrayBuffer();
                const base64Data = Buffer.from(arrayBuffer).toString('base64');

                const result = await model.generateContent([
                    "Transcribe all readable text from this study material image. Format it cleanly as text. If there are diagrams, describe them briefly.",
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: fileType
                        }
                    }
                ]);

                extractedText = result.response.text().trim();
                isExtractionSuccessful = extractedText.length > 10;
            } catch (imageError: any) {
                console.error('Image OCR error:', imageError);
                return NextResponse.json({
                    error: `Failed to process image: ${imageError.message || 'Unknown error'}.`,
                    textExtracted: false
                }, { status: 422 });
            }
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
            // DOCX extraction using mammoth
            try {
                const mammoth = await import('mammoth');
                const arrayBuffer = await fileData.arrayBuffer();
                const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
                extractedText = result.value.trim();
                isExtractionSuccessful = extractedText.length > 20;

                if (!isExtractionSuccessful) {
                    return NextResponse.json({
                        error: 'Could not extract enough text from this DOCX file. It may be empty or contain only images.',
                        textExtracted: false
                    }, { status: 422 });
                }
            } catch (docxError: any) {
                console.error('DOCX parsing error:', docxError);
                return NextResponse.json({
                    error: `Failed to parse DOCX: ${docxError.message || 'Unknown error'}. Please try pasting the text manually.`,
                    textExtracted: false
                }, { status: 422 });
            }
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx')) {
            // PPTX extraction using jszip to read slide XML
            try {
                const JSZip = (await import('jszip')).default;
                const arrayBuffer = await fileData.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);
                const slideFiles = Object.keys(zip.files)
                    .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
                    .sort();

                let fullText = '';
                for (const slidePath of slideFiles) {
                    const xmlContent = await zip.files[slidePath].async('text');
                    // Extract text between <a:t> tags
                    const textMatches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g);
                    if (textMatches) {
                        const slideText = textMatches
                            .map((match: string) => match.replace(/<\/?a:t>/g, ''))
                            .join(' ');
                        fullText += slideText + '\n';
                    }
                }

                extractedText = fullText.trim();
                isExtractionSuccessful = extractedText.length > 20;

                if (!isExtractionSuccessful) {
                    return NextResponse.json({
                        error: 'Could not extract enough text from this PPTX file. It may contain only images or diagrams.',
                        textExtracted: false
                    }, { status: 422 });
                }
            } catch (pptxError: any) {
                console.error('PPTX parsing error:', pptxError);
                return NextResponse.json({
                    error: `Failed to parse PPTX: ${pptxError.message || 'Unknown error'}.`,
                    textExtracted: false
                }, { status: 422 });
            }
        } else if (fileType === 'text/plain' || fileType === 'application/json') {
            extractedText = await fileData.text();
            isExtractionSuccessful = extractedText.length > 5;
        } else {
            return NextResponse.json({
                error: `The file type '${fileType}' is not currently supported for text extraction. Please use PDF, DOCX, PPTX, Images, or TXT.`
            }, { status: 400 });
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
