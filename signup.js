import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const DYNAMODB_TABLE_NAME = "Users";

export const handler = async (event) => {
  try {
    const { email, name, password } = JSON.parse(event.body);
    console.log(email, name, password);

    if (!(email && name && password)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Name, password and email required" }),
      };
    }

    const user = await getUserByEmail(email);

    if (user) {
      console.log("User exists");
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "User Already Exists!" }),
      };
    }
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

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "User successfully added" }),
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

const getUserByEmail = async (email) => {
  const item = {
    email: { S: email },
  };

  console.log(email);

  try {
    const data = await dynamoDB.send(
      new GetItemCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: item,
      })
    );
    console.log(data);
    if (data.Item) {
      return {
        email: data.Item.email.S,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};
