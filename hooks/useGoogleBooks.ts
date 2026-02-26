import { useState, useCallback } from 'react';

export interface GoogleBook {
    id: string;
    title: string;
    authors?: string[];
    description?: string;
    thumbnail?: string;
    pdfAvailable: boolean;
    pdfLink?: string;
    previewLink?: string;
    publicDomain: boolean;
}

export function useGoogleBooks() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<GoogleBook[]>([]);

    const searchBooks = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        const cacheKey = `google_books_${query.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setResults(parsed);
                setIsLoading(false);
                return;
            } catch (e) {
                // Parsing error, fallback to network
            }
        }

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
            const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
                query
            )}&printType=books&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch books from Google Books API');
            }

            const data = await response.json();

            const parsedResults: GoogleBook[] = (data.items || []).map((item: any) => {
                const volumeInfo = item.volumeInfo || {};
                const accessInfo = item.accessInfo || {};

                return {
                    id: item.id,
                    title: volumeInfo.title || 'Unknown Title',
                    authors: volumeInfo.authors || [],
                    description: volumeInfo.description || '',
                    // Use HTTPS to prevent mixed content warnings
                    thumbnail: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || undefined,
                    pdfAvailable: !!accessInfo.pdf?.isAvailable,
                    pdfLink: accessInfo.pdf?.acsTokenLink || accessInfo.pdf?.downloadLink || undefined,
                    previewLink: volumeInfo.previewLink || undefined,
                    publicDomain: !!accessInfo.publicDomain,
                };
            });

            localStorage.setItem(cacheKey, JSON.stringify(parsedResults));
            setResults(parsedResults);
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching books');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        searchBooks,
        results,
        isLoading,
        error,
    };
}
