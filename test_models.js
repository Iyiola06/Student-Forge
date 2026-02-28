import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const listResult = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("hello");
        console.log(listResult.response.text());
    } catch (error) {
        console.error(error);
    }
}

listModels();
