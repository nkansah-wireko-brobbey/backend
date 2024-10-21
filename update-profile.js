import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

const DYNAMODB_TABLE_NAME = "Users";
const BUCKET_NAME = "images-004"

export const handler = async (event) => {
  try {

    const email = event.pathParameters.email;

    const { filename, contentType } = JSON.parse(
      event.body
    );
    console.log(filename, contentType, email);
  
      // Generate pre-signed URL
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: filename,
        ContentType: contentType,
      };
      const command = new PutObjectCommand(uploadParams);

      const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

         // Update data in DynamoDB
    const timestamp = new Date().toISOString();
    
    await dynamoDB.send(
      new UpdateItemCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          email: { S: email }
        },
        UpdateExpression: "SET #dt = :updatedtime, #piu = :profileImgURL",
        ExpressionAttributeNames: {
          "#dt": "updatedtime",
          "#piu": "profileImgURL"
        },
        ExpressionAttributeValues: {
          ":updatedtime": { S: timestamp },
          ":profileImgURL": { S: uploadURL }
        }
      })
    );
    

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Image Updated", imgURL: uploadURL}),
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
