
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });


const DYNAMODB_TABLE_NAME = "Users";

export const handler = async (event) => {
  try {
    
    console.log(JSON.parse(
      event.body
    ))
    const { email, name, password } = JSON.parse(
      event.body
    );
    console.log(email, name, password);

      const timestamp = new Date().toISOString();
      const item = {
        email: { S: email },
        name: { S: name },
        password: { S: password },
        datetime: { S: timestamp },
      };

    const response = await dynamoDB.send(
        new PutItemCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: item,
        })
      ) || "Successfully Added";

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ response }),
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
