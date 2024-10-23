import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });
// const sns = new SNSClient({ region: "us-east-1" });
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

// const SNS_TOPIC_ARN = "your-sns-arn";
const DYNAMODB_TABLE_NAME = "your-table";

export const handler = async (event) => {
  try {
    const { filename, contentType, email, name, type, password } = JSON.parse(
      event.body
    );
    console.log(filename, contentType, email, type, name, password);
    const bucketName = "your-bucket";

    let action = "Nothing"

    if (type === "CREATE-USER") {
      // Save data to DynamoDB
      const timestamp = new Date().toISOString();
      const item = {
        email: { S: email },
        name: { S: name },
        password: { S: password },
        datetime: { S: timestamp },
      };

      await dynamoDB.send(
        new PutItemCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: item,
        })
      );
      action= "User created"
    }
    if (type === "PUT-PROFILE") {
      // Generate pre-signed URL
      const uploadParams = {
        Bucket: bucketName,
        Key: filename,
        ContentType: contentType,
      };
      const command = new PutObjectCommand(uploadParams);

      const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

      // Save data to DynamoDB
      const timestamp = new Date().toISOString();
      const item = {
        email: { S: email },
        name: { S: name },
        datetime: { S: timestamp },
        profileImgURL: {S: uploadURL}
      };

      await dynamoDB.send(
        new PutItemCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: item,
        })
      );
      action="Image uploaded"
    }

    // Send SNS notification
    // const snsMessage = `A new file named ${filename} was uploaded by ${email}.`;
    // await sns.send(
    //   new PublishCommand({
    //     Message: snsMessage,
    //     TopicArn: SNS_TOPIC_ARN,
    //   })
    // );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ action }),
    };
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
