import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pineconeEmbedAndStore } from "@/lib/vector-store";
import { getPineconeClient } from "@/lib/pinecone-client";

async function getChunkedDocsFromPDF(url:any) {
  try {
    const loader = new PDFLoader(url);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);

    return chunkedDocs;
  } catch (e) {
    console.error(e);
    throw new Error("PDF docs chunking failed !");
  }
}

const reqHeaders = {
  Authorization:
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MTAzOTg2MDEsIm5iZiI6MTcxMDM5ODYwMSwianRpIjoiMGRlYjJiNmUtZGY3OC00OTlmLWFkODEtNTAxM2ZjODY1YmFlIiwiaWRlbnRpdHkiOnsiTE9HSU4iOiJCeXBhc3NlZCIsIkVNUExPWUVFSUQiOiIzMDgyNjI1IiwiRU1QTE9ZRUVFTUFJTCI6InRvbm9AcHVwdWsta3VqYW5nLmNvLmlkIiwiRU1QTE9ZRUVOQU1FIjoiVG9ubyBTYXJ0b25vIiwiRU1QTE9ZRUVQSUNUVVJFIjoiaHR0cHM6Ly9zdGF0aWNzLnB1cHVrLWt1amFuZy5jby5pZC9kZW1wbG9uL3BpY2VtcC8zMDgyNjI1LmpwZyIsIlBPU0lEIjoiNTAwMDIxNjciLCJQT1NOQU1FIjoiU3VwZXJpbnRlbmRlbnQiLCJQQVJFTlRQRVJTT04iOnRydWUsIlBBUkVOVElEIjoiQzAwMTM3MDAwMCIsIlBBUkVOVE5BTUUiOiJEZXBhcnRlbWVuIE1pdHJhIEJpc25pcyBMYXlhbmFuIFRJIFBLQyJ9LCJmcmVzaCI6ZmFsc2UsInR5cGUiOiJhY2Nlc3MifQ.QKkXwEOLNk9u4fIrlyGOO37khMsO9dCRYxH4ebkenyQ",
};

(async () => {
  try {
    const pineconeClient = await getPineconeClient();

    const proceduresRaw = await fetch(
      "https://demplon.pupuk-kujang.co.id/admin/api/dimas/eprosedur/procedures/?categoryid[]=1",
      {
        headers: reqHeaders,
      }
    );

    const procedures = await proceduresRaw.json();

    for (let x in procedures) {
      const procedureRaw = await fetch(
        "http://localhost:2300/dimas/eprosedur/procedures/" +
          procedures[x].id +
          "/detail/",
        {
          headers: reqHeaders,
        }
      );
    
      const procedure = await procedureRaw.json();

      console.log(procedure);
    
      if (procedure?.file?.file_url) {
        const blob=await fetch(procedure.file.file_url);
        const blobbb=await blob.blob();
        let docs = await getChunkedDocsFromPDF(blobbb);

        docs=docs.map((val,i)=>{
          val.metadata.procedure=procedure
          val.pageContent= val.pageContent.replace(/(?:\r\n|\r|\n)/g, ' ').replace(/\s\s+/g, ' ');;
          return val
        })

        console.log('aing')
        await pineconeEmbedAndStore(pineconeClient, docs,'eprosedur-procedures');
      }
    }

    //const docs = await getChunkedDocsFromPDF(url);
    
    //await pineconeEmbedAndStore(pineconeClient, docs,'regulations');;
  } catch (error) {
    console.error("Init client script failed ", error);
  }
})();
