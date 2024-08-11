import { NextResponse } from "next/server" // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are a Walmart Tech Support Agent. Please try to answer all questions and queries as best as possible`;

// POST function to handle incoming requests
// we need a POST route (sending information and expecting stuff back)
export async function POST(req) {
  const openai = new OpenAI({
   // baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENAI_API_KEY,
  }); // create a new instance of the OpenAI client
  const data = await req.json(); // parse the JSON body of the incoming request (get JSON data from request)

  // Create a chat completion request to the OpenAI API
  // await function ensures code isn't blocked while waiting, so multiple requests can be sent at the same time

  const completion = await openai.chat.completions.create({
    // putting in system prompts into messages array
    // ... is a "spread operator" that adds the rest of the conversation history into the array
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'gpt-3.5-turbo', // AI model being used
    stream: true, // Enable streaming responses
  })

// Create a ReadableStream to handle the streaming response
const stream = new ReadableStream({
    // async start function is how the stream starts
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        // waits for every chunk that the completion sends (OpenAI sends completions as chunks)
        for await (const chunk of completion) {
            // ? used to make sure it exists
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          // if content exists
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            // send text to controller
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } 
      // need this block to close controller when done
      finally {
        controller.close() // Close the stream when done
      }
    },
  })

  // sending informaton as a stream
  return new NextResponse(stream) // Return the stream as the response
}