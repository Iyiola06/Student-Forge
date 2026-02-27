declare module 'pdfjs-dist/legacy/build/pdf.js' {
    export const GlobalWorkerOptions: any;
    export function getDocument(src: any): any;
    export const version: string;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.entry' {
    const workerSrc: string;
    export default workerSrc;
}
