import { env } from "./config";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { GoogleVertexAIEmbeddings } from "@langchain/community/embeddings/googlevertexai";

export async function pineconeEmbedAndStore(
  client: PineconeClient,
  // @ts-ignore docs type error
  docs: Document<Record<string, any>>[],
  namespace:string
) {
  /*create and store the embeddings in the vectorStore*/
  try {
    const embeddings:any = new GoogleVertexAIEmbeddings();
    const index = client.Index(env.PINECONE_INDEX_NAME);

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: namespace??env.PINECONE_NAME_SPACE,
      textKey: "text",
    });
  } catch (error) {
    console.log("error ", error);
    throw new Error("Failed to load your docs !");
  }
}

export async function getVectorStore(client: PineconeClient) {
  try {
    const embeddings:any = new GoogleVertexAIEmbeddings();
    const index = client.Index(env.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: "text",
      namespace: 'eprosedur-guidelines',
    });

    return vectorStore;
  } catch (error) {
    console.log("error ", error);
    throw new Error("Something went wrong while getting vector store !");
  }
}
