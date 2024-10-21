import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const DYNAMODB_TABLE_NAME = "Users";
// const SECRET_KEY =
//   "a5d5b1b4f7d19652619b5b317d4dd4ac27bba0a65a0c3ed2cab0f397f9d72ac2";

export const handler = async (event) => {
  try {
    console.log(JSON.parse(event.body));
    const { email, password } = JSON.parse(event.body);
    console.log(email, password);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }


    const user = await getUserByEmail(email);

    if (!user) {
      console.log("User not Found")
      return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "No such credentials!" }),
    }
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Invalid Username and Password!" })
      }
    }

    // const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "12h" });
    const token = user.email;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Successful Login", token }),
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
    email: { S: email }
  };
  
  console.log(email);

  try {
    const data = await dynamoDB.send(new GetItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: item,
    }));
    console.log(data);
    if (data.Item) {
      return {
        email: data.Item.email.S,
        password: data.Item.password.S
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};
