import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import S3Stack from '../lib/stacks/S3';

const handler = async (event: {
  Records: { s3: { bucket: { name: string }, object: { key: string } } }[] }) => {
  const s3 = event.Records[0].s3;
  const bucketName = s3.bucket.name;
  const objectKey = s3.object.key;

  // Check if the uploaded file is a .html file
  if (objectKey.endsWith('.html')) {
    const s3Client = new S3Client(S3Stack);
    const params = {
      Bucket: bucketName,
      CopySource: encodeURIComponent(`${bucketName}/${objectKey}`),
      Key: objectKey,
      MetadataDirective: 'REPLACE',
      Metadata: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    };

    try {
      // Update the metadata of the uploaded object
      await s3Client.send(new CopyObjectCommand(params));
      console.log(`Updated metadata for object: ${objectKey}`);
    } catch (error) {
      console.error(`Error updating metadata: ${error}`);
    }
  }
};

export default handler;
