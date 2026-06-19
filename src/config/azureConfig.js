const { BlobServiceClient } = require('@azure/storage-blob');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'hirehub-uploads';

let blobServiceClient = null;
let containerClient = null;

if (connectionString) {
    try {
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        containerClient = blobServiceClient.getContainerClient(containerName);
        console.log('✅ Azure Blob Storage configured');
    } catch (err) {
        console.error('⚠️ Failed to initialize Azure Blob Storage:', err.message);
    }
}

module.exports = {
    blobServiceClient,
    containerClient,
    containerName
};
